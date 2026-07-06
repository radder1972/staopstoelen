<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

$pdo = getDBConnection();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM chairs ORDER BY created_at DESC");
        $chairs = $stmt->fetchAll();
        
        // Format JSON columns for each chair
        foreach ($chairs as &$chair) {
            $chair['gallery'] = $chair['gallery'] ? json_decode($chair['gallery'], true) : null;
            $chair['features'] = $chair['features'] ? json_decode($chair['features'], true) : null;
            $chair['specifications'] = $chair['specifications'] ? json_decode($chair['specifications'], true) : null;
            $chair['is_offer'] = (bool)$chair['is_offer'];
            $chair['price'] = intval($chair['price']);
            $chair['old_price'] = $chair['old_price'] !== null ? intval($chair['old_price']) : null;
        }
        
        echo json_encode(["staopstoelen" => $chairs]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["error" => "Failed to fetch chairs: " . $e->getMessage()]);
    }
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
        
        $pdo->beginTransaction();
        
        // 1. Get current IDs in the database
        $stmt = $pdo->query("SELECT id FROM chairs");
        $existing_ids = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Prepare queries
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
        foreach ($input['staopstoelen'] as $chair) {
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
        
        // 2. Delete orphans (IDs that are in database but NOT in payload)
        $ids_to_delete = array_diff($existing_ids, $payload_ids);
        if (!empty($ids_to_delete)) {
            $in_clause = implode(',', array_map(function($id) use ($pdo) {
                return $pdo->quote($id);
            }, $ids_to_delete));
            $pdo->exec("DELETE FROM chairs WHERE id IN ($in_clause)");
        }
        
        $pdo->commit();
        echo json_encode(["message" => "Database updated successfully in MySQL"]);
        
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["error" => "Failed to save to MySQL: " . $e->getMessage()]);
    }
    exit;
}

http_response_code(405);
echo json_encode(["error" => "Method not allowed"]);
