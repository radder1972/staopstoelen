<?php
// Purge LiteSpeed Server Cache hook
header('X-LiteSpeed-Purge: *');
header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Content-Type: application/json; charset=UTF-8');

echo json_encode([
    'status' => 'success',
    'message' => 'LiteSpeed cache purge header emitted',
    'timestamp' => date('c')
]);
