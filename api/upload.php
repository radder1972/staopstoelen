<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input || !isset($input['filename']) || !isset($input['fileData'])) {
    http_response_code(400);
    echo json_encode(["error" => "Missing filename or fileData"]);
    exit;
}

// Parse base64
$data = $input['fileData'];
if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
    $data = substr($data, strpos($data, ',') + 1);
    $data = base64_decode($data);
} else {
    http_response_code(400);
    echo json_encode(["error" => "Invalid base64 data"]);
    exit;
}

// Sanitize filename to prevent directory traversal
$filename = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', basename($input['filename']));
$upload_dir = __DIR__ . '/../assets/';

if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0755, true);
}

if (file_put_contents($upload_dir . $filename, $data)) {
    echo json_encode([
        "message" => "Uploaded successfully",
        "url" => "assets/" . $filename
    ]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Failed to write file"]);
}
