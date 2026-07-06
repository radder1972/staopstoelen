<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
require_once __DIR__ . '/db.php';

try {
    $pdo = getDBConnection();
    
    // We only fetch stats for the last 30 days
    $days = 30;
    
    // 1. Overview counts
    $stmt = $pdo->prepare("SELECT COUNT(*) as total_views, COUNT(DISTINCT ip_hash) as unique_visitors 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)");
    $stmt->execute([':days' => $days]);
    $overview = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // 2. Daily views & unique visitors
    $stmt = $pdo->prepare("SELECT DATE(timestamp) as date, COUNT(*) as views, COUNT(DISTINCT ip_hash) as uniques 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)
                           GROUP BY DATE(timestamp) 
                           ORDER BY DATE(timestamp) ASC");
    $stmt->execute([':days' => $days]);
    $daily = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 3. Conversions (by event name)
    $stmt = $pdo->prepare("SELECT DATE(timestamp) as date, event_name, COUNT(*) as count 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) AND event_name IN ('booking_conversion', 'keuzehulp_start')
                           GROUP BY DATE(timestamp), event_name 
                           ORDER BY DATE(timestamp) ASC");
    $stmt->execute([':days' => $days]);
    $conversions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 4. Device breakdown
    $stmt = $pdo->prepare("SELECT device_type, COUNT(*) as count 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY)
                           GROUP BY device_type");
    $stmt->execute([':days' => $days]);
    $devices = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 5. Top pages
    $stmt = $pdo->prepare("SELECT page_url, COUNT(*) as count 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) AND event_name = 'pageview'
                           GROUP BY page_url 
                           ORDER BY count DESC 
                           LIMIT 10");
    $stmt->execute([':days' => $days]);
    $top_pages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 6. Top referrers
    $stmt = $pdo->prepare("SELECT referrer_url, COUNT(*) as count 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) AND referrer_url IS NOT NULL AND referrer_url != ''
                           GROUP BY referrer_url 
                           ORDER BY count DESC 
                           LIMIT 10");
    $stmt->execute([':days' => $days]);
    $top_referrers = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // 7. Top UTM Campaign Sources
    $stmt = $pdo->prepare("SELECT utm_source, COUNT(*) as count 
                           FROM visits 
                           WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :days DAY) AND utm_source IS NOT NULL AND utm_source != ''
                           GROUP BY utm_source 
                           ORDER BY count DESC 
                           LIMIT 10");
    $stmt->execute([':days' => $days]);
    $top_utm = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "status" => "success",
        "days" => $days,
        "overview" => $overview,
        "daily" => $daily,
        "conversions" => $conversions,
        "devices" => $devices,
        "top_pages" => $top_pages,
        "top_referrers" => $top_referrers,
        "top_utm" => $top_utm
    ]);
} catch (Exception $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
