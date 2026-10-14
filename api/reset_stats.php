<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'truncate';

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

    if ($action === 'clean_my_ip') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $salt = "staopstoelen_secret_salt_2026";
        $ip_hash = hash('sha256', $ip . $salt);

        // 1. Add to excluded_ips.json list
        $excluded_file = __DIR__ . '/excluded_ips.json';
        $excluded = [];
        if (file_exists($excluded_file)) {
            $excluded = json_decode(file_get_contents($excluded_file), true) ?: [];
        }
        if (!in_array($ip_hash, $excluded)) {
            $excluded[] = $ip_hash;
            file_put_contents($excluded_file, json_encode($excluded, JSON_PRETTY_PRINT));
        }

        // 2. Delete existing visits from this IP hash
        $stmt = $pdo->prepare("DELETE FROM visits WHERE ip_hash = :hash");
        $stmt->execute([':hash' => $ip_hash]);
        $deleted = $stmt->rowCount();

        echo json_encode([
            "status" => "success",
            "action" => "clean_my_ip",
            "deleted" => $deleted,
            "message" => "Uw IP-adres is permanent uitgesloten van statistieken en {$deleted} eigen bezoeken zijn succesvol verwijderd."
        ]);
        exit;
    }

    // Default action: Truncate visits table to reset all statistics
    $pdo->exec("TRUNCATE TABLE visits");
    
    echo json_encode([
        "status" => "success",
        "action" => "truncate",
        "message" => "Visits statistics reset successfully."
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Failed to process request: " . $e->getMessage()
    ]);
}
