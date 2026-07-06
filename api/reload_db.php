<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // Truncate chairs table
    $pdo->exec("TRUNCATE TABLE chairs");
    
    $json_file = __DIR__ . '/../database.json';
    if (!file_exists($json_file)) {
        throw new Exception("database.json not found");
    }
    
    $json_data = json_decode(file_get_contents($json_file), true);
    if (!isset($json_data['staopstoelen']) || !is_array($json_data['staopstoelen'])) {
        throw new Exception("Invalid database.json format");
    }
    
    $insert_chair = $pdo->prepare("INSERT INTO chairs (
        id, name, brand, model, price, old_price, `condition`, status, type, material,
        badge, badgeType, image, imageUp, gallery, features, specifications, is_offer
    ) VALUES (
        :id, :name, :brand, :model, :price, :old_price, :condition, :status, :type, :material,
        :badge, :badgeType, :image, :imageUp, :gallery, :features, :specifications, :is_offer
    )");
    
    $imported = 0;
    foreach ($json_data['staopstoelen'] as $chair) {
        $insert_chair->execute([
            ':id' => $chair['id'],
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
            ':is_offer' => !empty($chair['is_offer']) ? 1 : 0
        ]);
        $imported++;
    }
    
    echo json_encode([
        "status" => "success",
        "message" => "Successfully truncated and reloaded $imported chairs from database.json."
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Reload failed: " . $e->getMessage()
    ]);
}
