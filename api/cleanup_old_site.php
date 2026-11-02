<?php
/**
 * Server Cleanup Utility: Identificeert en verplaatst oude WordPress/backup bestanden naar 'oude_site'
 */
header('Content-Type: application/json; charset=utf-8');

$SECRET_TOKEN = 'clean_staopstoelen_2026_99';

if (!isset($_GET['token']) || $_GET['token'] !== $SECRET_TOKEN) {
    http_response_code(403);
    echo json_encode(['error' => 'Geen toegang. Ongeldig of ontbrekend token.']);
    exit;
}

$root_dir = realpath(__DIR__ . '/..');
if (!$root_dir || !is_dir($root_dir)) {
    http_response_code(500);
    echo json_encode(['error' => 'Kon public_html root directory niet bepalen.']);
    exit;
}

$target_folder_name = 'oude_site';
$target_dir = $root_dir . '/' . $target_folder_name;

// Whitelist van bestanden en mappen die bij de HUIDIGE website horen
$current_site_whitelist = [
    '.htaccess', 'VERSION', 'afspraak.html', 'afvinklijst.html',
    'android-chrome-192x192.png', 'android-chrome-512x512.png', 'api', 'app.js',
    'apple-touch-icon.png', 'assets', 'badge-a6-stoel.html', 'bedankt.html',
    'beheer.html', 'booklet-a5.html', 'certified-fitform-concept.html',
    'certified-fitform-consument.html', 'certified-fitform-infographic.html',
    'certified-fitform-video.html', 'database.json', 'deurmat_animatie_en_pitch_geertjan.html',
    'ervaringen.html', 'faq.html', 'favicon-16x16.png', 'favicon-32x32.png',
    'favicon.ico', 'favicon.svg', 'fitform-dealer-dordrecht.html', 'fix_images.py',
    'flyer-a4-drukvel-langezijde.html', 'flyer-a4-drukvel.html', 'flyer-a4-met-marges.html',
    'flyer-a4-p1.html', 'flyer-a4-p2.html', 'flyer-a5-booklet.html', 'flyer-a5-liggend.html',
    'flyer-a5-stoel.html', 'flyer-a5.html', 'flyer.html', 'flyer_a4_drukvel_2xA5.pdf',
    'flyer_a4_drukvel_langezijde_duplex.pdf', 'flyer_a4_drukvel_safe_2xA5.pdf',
    'flyer_a4_pagina1_voorkant_2xA5.pdf', 'flyer_a4_pagina2_achterkant_2xA5.pdf',
    'flyer_a5_najaarsactie.pdf', 'fruitmachine_dashboard.html', 'geertjan_keuze_wizard.html',
    'geertjan_video_presentatie.html', 'groeidagboek_7dagen.html', 'index.html',
    'index.php', 'indicatiewijzer.html', 'info.html', 'keuringsrapport.html',
    'keuzehulp.html', 'klembord-afvinklijst.html', 'live_database.json', 'orderbon.html',
    'remote_images.txt', 'render-sheet-only.html', 'render_seal.html', 'render_seal_png.html',
    'render_swoosh.html', 'review.html', 'revisie.html', 'robots.txt', 'scripts',
    'seniorenstoelen.html', 'server.js', 'site.webmanifest', 'sitemap.xml',
    'sta-op-stoel-alblasserdam.html', 'sta-op-stoel-barendrecht.html', 'sta-op-stoel-dordrecht.html',
    'sta-op-stoel-gorinchem.html', 'sta-op-stoel-hardinxveld-giessendam.html',
    'sta-op-stoel-hendrik-ido-ambacht.html', 'sta-op-stoel-nieuw-lekkerland.html',
    'sta-op-stoel-oud-beijerland.html', 'sta-op-stoel-papendrecht.html',
    'sta-op-stoel-puttershoek.html', 'sta-op-stoel-ridderkerk.html',
    'sta-op-stoel-sgravendeel.html', 'sta-op-stoel-sliedrecht.html',
    'sta-op-stoel-strijen.html', 'sta-op-stoel-zwijndrecht.html', 'staopstoelen.html',
    'stoel-anatomie.html', 'stoelen', 'style.css', 'test-stemmen.html',
    'video-sitemap.xml', 'visitekaartje-geertjan.html', 'visitekaartje-matthias.html',
    'visitekaartje-suus.html', 'visitekaartje.html', 'waarom-certified-fitform.html',
    'wat-kost-een-sta-op-stoel.html', 'winkel.html', 'zithouding-checklist.html',
    $target_folder_name, 'error_log', '.ftpquota'
];

// Whitelist van bestanden en mappen die ALTIJD in de root moeten blijven
$protected_system_items = [
    '.ftp-deploy-sync-state.json',
    '.well-known',
    '.procmail',
    'awstats',
    'cgi-bin',
    'stats',
    'usage',
    'logs',
    'tmp'
];

$entries = scandir($root_dir);
$scan_results = [
    'root_dir' => $root_dir,
    'current_kept' => [],
    'system_kept' => [],
    'old_candidates' => []
];

foreach ($entries as $item) {
    if ($item === '.' || $item === '..') {
        continue;
    }

    // Google verification files behouden
    if (strpos($item, 'google') === 0 && substr($item, -5) === '.html') {
        $scan_results['system_kept'][] = $item;
        continue;
    }

    if (in_array($item, $protected_system_items)) {
        $scan_results['system_kept'][] = $item;
        continue;
    }

    if (in_array($item, $current_site_whitelist)) {
        $scan_results['current_kept'][] = $item;
    } else {
        $full_path = $root_dir . '/' . $item;
        $is_dir = is_dir($full_path);
        $size = $is_dir ? null : filesize($full_path);
        $scan_results['old_candidates'][] = [
            'name' => $item,
            'type' => $is_dir ? 'directory' : 'file',
            'size' => $size,
            'size_formatted' => $size !== null ? round($size / 1048576, 2) . ' MB' : null
        ];
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : 'scan';

if ($action === 'scan') {
    echo json_encode([
        'status' => 'success',
        'action' => 'scan',
        'total_found' => count($scan_results['old_candidates']),
        'candidates' => $scan_results['old_candidates'],
        'kept_count' => count($scan_results['current_kept'])
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($action === 'move') {
    if (!file_exists($target_dir)) {
        if (!mkdir($target_dir, 0755, true)) {
            http_response_code(500);
            echo json_encode(['error' => 'Kon doelmap ' . $target_folder_name . ' niet aanmaken.']);
            exit;
        }
    }

    // Beveilig de doelmap met .htaccess zodat er geen code kan worden uitgevoerd door bots
    $target_htaccess = $target_dir . '/.htaccess';
    if (!file_exists($target_htaccess)) {
        file_put_contents($target_htaccess, "# Oude site archief - toegang geblokkeerd\nRequire all denied\n");
    }

    $moved = [];
    $failed = [];

    foreach ($scan_results['old_candidates'] as $candidate) {
        $name = $candidate['name'];
        $src = $root_dir . '/' . $name;
        $dst = $target_dir . '/' . $name;

        if (rename($src, $dst)) {
            $moved[] = $name;
        } else {
            $failed[] = $name;
        }
    }

    echo json_encode([
        'status' => 'success',
        'action' => 'move',
        'moved_count' => count($moved),
        'moved' => $moved,
        'failed_count' => count($failed),
        'failed' => $failed,
        'archive_directory' => $target_dir
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Onbekende actie. Kies ?action=scan of ?action=move']);
