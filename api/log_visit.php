<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "Only POST requests allowed"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input || empty($input['page_url'])) {
    echo json_encode(["status" => "error", "message" => "Invalid input data"]);
    exit;
}

try {
    $pdo = getDBConnection();
    
    // Hash IP address with a salt for privacy / AVG compliance
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $salt = "staopstoelen_secret_salt_2026";
    $ip_hash = hash('sha256', $ip . $salt);
    
    $page_url = substr(trim($input['page_url']), 0, 255);
    $referrer_url = !empty($input['referrer_url']) ? substr(trim($input['referrer_url']), 0, 255) : null;
    $utm_source = !empty($input['utm_source']) ? substr(trim($input['utm_source']), 0, 50) : null;
    $utm_medium = !empty($input['utm_medium']) ? substr(trim($input['utm_medium']), 0, 50) : null;
    $utm_campaign = !empty($input['utm_campaign']) ? substr(trim($input['utm_campaign']), 0, 50) : null;
    $device_type = !empty($input['device_type']) ? substr(trim($input['device_type']), 0, 20) : 'desktop';
    $event_name = !empty($input['event_name']) ? substr(trim($input['event_name']), 0, 50) : 'pageview';
    
    $stmt = $pdo->prepare("INSERT INTO visits (ip_hash, page_url, referrer_url, utm_source, utm_medium, utm_campaign, device_type, event_name) 
                           VALUES (:ip_hash, :page_url, :referrer_url, :utm_source, :utm_medium, :utm_campaign, :device_type, :event_name)");
                           
    $stmt->execute([
        ':ip_hash' => $ip_hash,
        ':page_url' => $page_url,
        ':referrer_url' => $referrer_url,
        ':utm_source' => $utm_source,
        ':utm_medium' => $utm_medium,
        ':utm_campaign' => $utm_campaign,
        ':device_type' => $device_type,
        ':event_name' => $event_name
    ]);
    
    echo json_encode(["status" => "success", "message" => "Visit logged successfully"]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
