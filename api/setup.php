<?php
header("Content-Type: application/json");
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // 1. Create brands table
    $pdo->exec("CREATE TABLE IF NOT EXISTS brands (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // 2. Create chairs table
    $pdo->exec("CREATE TABLE IF NOT EXISTS chairs (
        id VARCHAR(100) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(100) NULL,
        model VARCHAR(100) NULL,
        price INT NOT NULL,
        old_price INT NULL,
        `condition` VARCHAR(50) NULL,
        status VARCHAR(50) NULL,
        type VARCHAR(50) NULL,
        material VARCHAR(100) NULL,
        badge VARCHAR(100) NULL,
        badgeType VARCHAR(50) NULL,
        image TEXT NULL,
        imageUp TEXT NULL,
        gallery TEXT NULL,
        features TEXT NULL,
        specifications TEXT NULL,
        is_offer TINYINT(1) DEFAULT 0,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    
    // Ensure description column exists in existing tables
    $checkDesc = $pdo->query("SHOW COLUMNS FROM chairs LIKE 'description'")->fetch();
    if (!$checkDesc) {
        $pdo->exec("ALTER TABLE chairs ADD COLUMN description TEXT NULL AFTER is_offer;");
    }
    
    $messages = ["Database tables verified/created successfully."];
    
    // 3. Populate default brands if empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM brands");
    $brand_count = $stmt->fetchColumn();
    if ($brand_count == 0) {
        $default_brands = [
            ['fitform', 'Fitform'],
            ['doge', 'Doge'],
            ['mecam', 'Mecam'],
            ['hjort-knudsen', 'Hjort Knudsen'],
            ['dfm', 'DFM'],
            ['de-toekomst', 'De Toekomst'],
            ['farstrup', 'Farstrup'],
            ['huismerk', 'Huismerk'],
            ['overig', 'Overig']
        ];
        
        $insert_brand = $pdo->prepare("INSERT INTO brands (id, name) VALUES (?, ?)");
        foreach ($default_brands as $brand) {
            $insert_brand->execute($brand);
        }
        $messages[] = "Initialized default brands list.";
    }
    
    // 4. Import from database.json if chairs table is empty
    $stmt = $pdo->query("SELECT COUNT(*) FROM chairs");
    $chair_count = $stmt->fetchColumn();
    if ($chair_count == 0) {
        $json_file = __DIR__ . '/../database.json';
        if (file_exists($json_file)) {
            $json_data = json_decode(file_get_contents($json_file), true);
            if (isset($json_data['staopstoelen']) && is_array($json_data['staopstoelen'])) {
                $insert_chair = $pdo->prepare("INSERT INTO chairs (
                    id, name, brand, model, price, old_price, `condition`, status, type, material,
                    badge, badgeType, image, imageUp, gallery, features, specifications, is_offer, description
                ) VALUES (
                    :id, :name, :brand, :model, :price, :old_price, :condition, :status, :type, :material,
                    :badge, :badgeType, :image, :imageUp, :gallery, :features, :specifications, :is_offer, :description
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
                        ':is_offer' => !empty($chair['is_offer']) ? 1 : 0,
                        ':description' => $chair['description'] ?? null
                    ]);
                    $imported++;
                }
                $messages[] = "Successfully imported $imported chairs from database.json.";
            } else {
                $messages[] = "No chairs found in database.json structure.";
            }
        } else {
            $messages[] = "No local database.json found to import from.";
        }
    } else {
        $messages[] = "Chairs table already contains data; skipped import.";
    }
    
    echo json_encode([
        "status" => "success",
        "details" => $messages
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Setup failed: " . $e->getMessage()
    ]);
}
