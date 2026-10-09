<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // Ensure visits table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS visits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_hash VARCHAR(64) NOT NULL,
        page_url VARCHAR(255) NOT NULL,
        referrer_url VARCHAR(255) NULL,
        utm_source VARCHAR(100) NULL,
        utm_medium VARCHAR(100) NULL,
        utm_campaign VARCHAR(100) NULL,
        device_type VARCHAR(20) DEFAULT 'desktop',
        event_name VARCHAR(50) DEFAULT 'pageview',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_timestamp (timestamp),
        INDEX idx_event (event_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Truncate visits table to reset all statistics
    $pdo->exec("TRUNCATE TABLE visits");
    
    echo json_encode([
        "status" => "success",
        "message" => "Visits statistics reset successfully."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to reset statistics: " . $e->getMessage()
    ]);
}
