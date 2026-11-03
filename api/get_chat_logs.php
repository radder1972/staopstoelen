<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/db.php';

$logs = [];
$source = 'none';

// 1. Probeer eerst via MySQL
try {
    $pdo = getDBConnection();
    $stmt = $pdo->query("SELECT id, ip_hash, question, reply, actions, created_at FROM chat_logs ORDER BY created_at DESC LIMIT 60");
    $dbRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($dbRows)) {
        foreach ($dbRows as $row) {
            $actions = !empty($row['actions']) ? explode(',', $row['actions']) : [];
            $logs[] = [
                'id' => $row['id'],
                'timestamp' => $row['created_at'],
                'question' => $row['question'],
                'reply' => $row['reply'],
                'actions' => $actions
            ];
        }
        $source = 'mysql';
    }
} catch (Throwable $t) {
    // MySQL tabel bestaat nog niet of verbinding tijdelijk niet beschikbaar
}

// 2. Fallback naar chat_logs.json
if (empty($logs)) {
    $chatLogFile = __DIR__ . '/chat_logs.json';
    if (file_exists($chatLogFile)) {
        $raw = @file_get_contents($chatLogFile);
        $jsonLogs = json_decode($raw, true) ?: [];
        if (!empty($jsonLogs)) {
            $logs = array_slice($jsonLogs, 0, 60);
            $source = 'json_backup';
        }
    }
}

echo json_encode([
    "status" => "success",
    "source" => $source,
    "count" => count($logs),
    "logs" => $logs
], JSON_UNESCAPED_UNICODE);
