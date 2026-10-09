<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

$json_file = __DIR__ . '/../database.json';

// GET: Return current chairs list
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $pdo = getDBConnection();
        $stmt = $pdo->query("SELECT * FROM chairs ORDER BY created_at DESC");
        $chairs = $stmt->fetchAll();
        
        foreach ($chairs as &$chair) {
            $chair['gallery'] = $chair['gallery'] ? json_decode($chair['gallery'], true) : null;
            $chair['features'] = $chair['features'] ? json_decode($chair['features'], true) : null;
            $chair['specifications'] = $chair['specifications'] ? json_decode($chair['specifications'], true) : null;
            $chair['is_offer'] = (bool)$chair['is_offer'];
            $chair['price'] = intval($chair['price']);
            $chair['old_price'] = $chair['old_price'] !== null ? intval($chair['old_price']) : null;
        }
        
        echo json_encode([
            "status" => "success",
            "source" => "mysql",
            "staopstoelen" => $chairs
        ]);
        exit;
    } catch (Exception $e) {
        // Fallback to database.json if MySQL fails
        if (file_exists($json_file)) {
            $raw = file_get_contents($json_file);
            $parsed = json_decode($raw, true);
            if ($parsed && isset($parsed['staopstoelen'])) {
                echo json_encode([
                    "status" => "success",
                    "source" => "json_backup",
                    "staopstoelen" => $parsed['staopstoelen']
                ]);
                exit;
            }
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "error" => "MySQL and backup catalog unavailable: " . $e->getMessage()]);
        exit;
    }
}

// POST: Save updated chairs catalog to MySQL and database.json
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['staopstoelen']) || !is_array($input['staopstoelen'])) {
            http_response_code(400);
            echo json_encode(["status" => "error", "error" => "Ongeldige gegevensstructuur."]);
            exit;
        }
        
        $chairs_list = $input['staopstoelen'];
        $mysql_saved = false;
        
        try {
            $pdo = getDBConnection();
            $pdo->beginTransaction();
            
            $stmt = $pdo->query("SELECT id FROM chairs");
            $existing_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $upsert_stmt = $pdo->prepare("INSERT INTO chairs (
                id, name, brand, model, price, old_price, `condition`, status, type, material,
                badge, badgeType, image, imageUp, imageLie, ambientImage, gallery, features, specifications, is_offer, description
            ) VALUES (
                :id, :name, :brand, :model, :price, :old_price, :condition, :status, :type, :material,
                :badge, :badgeType, :image, :imageUp, :imageLie, :ambientImage, :gallery, :features, :specifications, :is_offer, :description
            ) ON DUPLICATE KEY UPDATE 
                name = VALUES(name),
                brand = VALUES(brand),
                model = VALUES(model),
                price = VALUES(price),
                old_price = VALUES(old_price),
                `condition` = VALUES(`condition`),
                status = VALUES(status),
                type = VALUES(type),
                material = VALUES(material),
                badge = VALUES(badge),
                badgeType = VALUES(badgeType),
                image = VALUES(image),
                imageUp = VALUES(imageUp),
                imageLie = VALUES(imageLie),
                ambientImage = VALUES(ambientImage),
                gallery = VALUES(gallery),
                features = VALUES(features),
                specifications = VALUES(specifications),
                is_offer = VALUES(is_offer),
                description = VALUES(description)");
                
            $payload_ids = [];
            foreach ($chairs_list as $chair) {
                $id = $chair['id'];
                $payload_ids[] = $id;
                
                $upsert_stmt->execute([
                    ':id' => $id,
                    ':name' => $chair['name'] ?? '',
                    ':brand' => $chair['brand'] ?? null,
                    ':model' => $chair['model'] ?? null,
                    ':price' => intval($chair['price'] ?? 0),
                    ':old_price' => isset($chair['old_price']) ? intval($chair['old_price']) : null,
                    ':condition' => $chair['condition'] ?? null,
                    ':status' => $chair['status'] ?? null,
                    ':type' => $chair['type'] ?? null,
                    ':material' => $chair['material'] ?? null,
                    ':badge' => $chair['badge'] ?? null,
                    ':badgeType' => $chair['badgeType'] ?? null,
                    ':image' => $chair['image'] ?? null,
                    ':imageUp' => $chair['imageUp'] ?? null,
                    ':imageLie' => $chair['imageLie'] ?? null,
                    ':ambientImage' => $chair['ambientImage'] ?? null,
                    ':gallery' => isset($chair['gallery']) ? json_encode($chair['gallery']) : null,
                    ':features' => isset($chair['features']) ? json_encode($chair['features']) : null,
                    ':specifications' => isset($chair['specifications']) ? json_encode($chair['specifications']) : null,
                    ':is_offer' => !empty($chair['is_offer']) ? 1 : 0,
                    ':description' => $chair['description'] ?? null
                ]);
            }
            
            $ids_to_delete = array_diff($existing_ids, $payload_ids);
            if (!empty($ids_to_delete)) {
                $in_clause = implode(',', array_map(function($id) use ($pdo) {
                    return $pdo->quote($id);
                }, $ids_to_delete));
                $pdo->exec("DELETE FROM chairs WHERE id IN ($in_clause)");
            }
            
            $pdo->commit();
            $mysql_saved = true;
        } catch (Exception $db_err) {
            // MySQL error handled gracefully; fallback save to JSON proceeds
        }
        
        // Save to database.json
        file_put_contents($json_file, json_encode(["staopstoelen" => $chairs_list], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        // Automatically sync static chair SEO pages, clean up obsolete models, and update sitemap.xml
        $sync_result = null;
        if (file_exists(__DIR__ . '/sync_static_pages.php')) {
            require_once __DIR__ . '/sync_static_pages.php';
            try {
                $sync_result = sync_static_chair_pages($chairs_list);
            } catch (Exception $sync_err) {
                error_log("Static pages sync error: " . $sync_err->getMessage());
            }
        }
        
        echo json_encode([
            "status" => "success",
            "count" => count($chairs_list),
            "mysql_saved" => $mysql_saved,
            "sync_result" => $sync_result,
            "message" => "Succesvol opgeslagen! (" . count($chairs_list) . " stoelen, SEO-pagina's en sitemap automatisch bijgewerkt)"
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "error" => "Opslaan mislukt: " . $e->getMessage()]);
        exit;
    }
}

http_response_code(405);
echo json_encode(["status" => "error", "error" => "Method not allowed"]);
