<?php
/**
 * Root index handler for Staopstoelen.nl
 * 
 * 1. Overwrites any residual legacy WordPress index.php on the server.
 * 2. Emits X-LiteSpeed-Purge to invalidate stale server-side LiteSpeed caches.
 * 3. Serves the modern static index.html or redirects.
 */

// Tell LiteSpeed to purge all caches for this host
header('X-LiteSpeed-Purge: *');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';

// If requested as /index.php explicitly, 301 redirect to /
if (preg_match('#^/index\.php(\?.*)?$#', $requestUri)) {
    header('Location: /', true, 301);
    exit;
}

// Serve modern index.html directly
$indexHtml = __DIR__ . '/index.html';
if (file_exists($indexHtml)) {
    header('Content-Type: text/html; charset=UTF-8');
    readfile($indexHtml);
    exit;
}

echo "Staopstoelen.nl";
