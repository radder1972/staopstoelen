<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$json_file = __DIR__ . '/../database.json';
$live_json_file = __DIR__ . '/../live_database.json';

function tryGetPDO() {
    if (!file_exists(__DIR__ . '/db.php')) {
        return null;
    }
    try {
        $dsn = "mysql:host=localhost;dbname=geertjan1_newwebsite;charset=utf8mb4";
        return new PDO($dsn, 'geertjan1_matthias', 'j)z5_Z%SODGW.kVM', [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch ( Throwable $e ) {
        return null;
    }
}

function normalizeChairsList($chairs) {
    if (!is_array($chairs)) return [];
    foreach ($chairs as &$chair) {
        if (isset($chair['gallery']) && is_string($chair['gallery'])) {
            $chair['gallery'] = json_decode($chair['gallery'], true);
        }
        if (isset($chair['features']) && is_string($chair['features'])) {
            $chair['features'] = json_decode($chair['features'], true);
        }
        if (isset($chair['specifications']) && is_string($chair['specifications'])) {
            $chair['specifications'] = json_decode($chair['specifications'], true);
        }
        $chair['is_offer'] = !empty($chair['is_offer']);
        $chair['price'] = intval($chair['price'] ?? 0);
        $chair['old_price'] = (isset($chair['old_price']) && $chair['old_price'] !== null) ? intval($chair['old_price']) : null;

        if (($chair['id'] ?? '') === 'sta-op-stoel-rene') {
            $chair['image'] = 'assets/stoelen/Sta-op-stoel-RENE.jpg';
            if (is_array($chair['gallery'])) {
                $filtered = array_values(array_filter($chair['gallery'], function($g) {
                    return strpos($g, 'Sta-op-stoel-RENE.jpg') === false;
                }));
                $chair['gallery'] = array_merge(['assets/stoelen/Sta-op-stoel-RENE.jpg'], $filtered);
            }
        }
    }
    return $chairs;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $chairs = null;

    // 1. Try MySQL if available
    $pdo = tryGetPDO();
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM chairs ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            if (is_array($rows) && count($rows) > 0) {
                $chairs = $rows;
            }
        } catch (Throwable $e) {
            $chairs = null;
        }
    }

    // 2. Fallback to database.json or live_database.json
    if ($chairs === null) {
        foreach ([$json_file, $live_json_file] as $candidate) {
            if (file_exists($candidate)) {
                $parsed = json_decode(file_get_contents($candidate), true);
                if (is_array($parsed) && isset($parsed['staopstoelen']) && is_array($parsed['staopstoelen'])) {
                    $chairs = $parsed['staopstoelen'];
                    break;
                }
            }
        }
    }

    if ($chairs === null) {
        $chairs = [];
    }

    $chairs = normalizeChairsList($chairs);
    echo json_encode(["staopstoelen" => $chairs]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);
        if (!$input || !isset($input['staopstoelen']) || !is_array($input['staopstoelen'])) {
            http_response_code(400);
            echo json_encode(["error" => "Invalid payload structure. Requires staopstoelen array."]);
            exit;
        }

        $chairs_input = normalizeChairsList($input['staopstoelen']);

        // Save to database.json (primary persistent store on server)
        file_put_contents($json_file, json_encode(["staopstoelen" => $chairs_input], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

        // Optional: also sync to MySQL if available
        $pdo = tryGetPDO();
        if ($pdo) {
            try {
                $pdo->beginTransaction();
                $stmt = $pdo->query("SELECT id FROM chairs");
                $existing_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);

                $upsert_stmt = $pdo->prepare("INSERT INTO chairs (
                    id, name, brand, model, price, old_price, `condition`, status, type, material,
                    badge, badgeType, image, imageUp, gallery, features, specifications, is_offer, description
                ) VALUES (
                    :id, :name, :brand, :model, :price, :old_price, :condition, :status, :type, :material,
                    :badge, :badgeType, :image, :imageUp, :gallery, :features, :specifications, :is_offer, :description
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
                    gallery = VALUES(gallery),
                    features = VALUES(features),
                    specifications = VALUES(specifications),
                    is_offer = VALUES(is_offer),
                    description = VALUES(description)");

                $payload_ids = [];
                foreach ($chairs_input as $chair) {
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
            } catch (Throwable $db_err) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
            }
        }

        $sync_result = null;
        if (file_exists(__DIR__ . '/sync_static_pages.php')) {
            require_once __DIR__ . '/sync_static_pages.php';
            try {
                $sync_result = sync_static_chair_pages($chairs_input);
            } catch (Throwable $sync_err) {
                error_log("Static pages sync error: " . $sync_err->getMessage());
            }
        }

        echo json_encode([
            "message" => "Database updated successfully",
            "sync_result" => $sync_result
        ]);
    } catch (Throwable $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to save: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
