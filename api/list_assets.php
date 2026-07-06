<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$assets_dir = __DIR__ . '/../assets';
$files = [];

if (is_dir($assets_dir)) {
    $dir = opendir($assets_dir);
    while (($file = readdir($dir)) !== false) {
        if ($file !== '.' && $file !== '..' && !is_dir($assets_dir . '/' . $file)) {
            // Check if it's an image
            $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
            if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'])) {
                $files[] = 'assets/' . $file;
            }
        }
    }
    closedir($dir);
}

// Sort alphabetically
sort($files);

echo json_encode($files);
