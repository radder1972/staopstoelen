<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // Fetch all pageviews in the last 30 days
    $stmt = $pdo->query("SELECT ip_hash, page_url, event_name, timestamp 
                         FROM visits 
                         WHERE event_name = 'pageview' 
                           AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                         ORDER BY ip_hash, timestamp ASC");
    $visits = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Group pageviews by visitor (ip_hash)
    $sessions = [];
    foreach ($visits as $visit) {
        $ip = $visit['ip_hash'];
        $url = $visit['page_url'];
        
        // Clean URL to readable page name
        $page = basename(parse_url($url, PHP_URL_PATH));
        if ($page === '' || $page === 'index.html' || $page === 'index.php') {
            $page = 'Home';
        } else {
            $page = str_replace('.html', '', $page);
            $page = ucfirst($page); // e.g. "Staopstoelen", "Seniorenstoelen"
        }
        
        if (!isset($sessions[$ip])) {
            $sessions[$ip] = [];
        }
        
        // Avoid adding the same page consecutively (filter refreshes)
        $last_index = count($sessions[$ip]) - 1;
        if ($last_index < 0 || $sessions[$ip][$last_index] !== $page) {
            $sessions[$ip][] = $page;
        }
    }
    
    // Count path frequencies
    $path_counts = [];
    foreach ($sessions as $ip => $path) {
        if (empty($path)) continue;
        $path_str = implode(' ➔ ', $path);
        if (!isset($path_counts[$path_str])) {
            $path_counts[$path_str] = 0;
        }
        $path_counts[$path_str]++;
    }
    
    // Sort paths by frequency descending
    arsort($path_counts);
    
    // Format for response
    $top_paths = [];
    $limit = 10;
    $count = 0;
    foreach ($path_counts as $path_str => $freq) {
        $top_paths[] = [
            "path" => $path_str,
            "count" => $freq
        ];
        $count++;
        if ($count >= $limit) break;
    }
    
    // Calculate page funnel unique visitor frequencies
    $page_uniques = [];
    foreach ($sessions as $ip => $path) {
        $unique_pages = array_unique($path);
        foreach ($unique_pages as $page) {
            if (!isset($page_uniques[$page])) {
                $page_uniques[$page] = 0;
            }
            $page_uniques[$page]++;
        }
    }
    
    arsort($page_uniques);
    $funnel = [];
    foreach ($page_uniques as $page => $freq) {
        $funnel[] = [
            "page" => $page,
            "visitors" => $freq
        ];
    }
    
    echo json_encode([
        "status" => "success",
        "top_paths" => $top_paths,
        "funnel" => $funnel
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => $e->getMessage()
    ]);
}
