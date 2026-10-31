<?php
// Google Gemini API Loader voor Staopstoelen.nl
// Dit bestand laadt de geheime sleutel uit gemini_secret.php of environment variabelen.

if (file_exists(__DIR__ . '/gemini_secret.php')) {
    require_once __DIR__ . '/gemini_secret.php';
}

if (!defined('GEMINI_API_KEY')) {
    $envKey = getenv('GEMINI_API_KEY');
    if (!$envKey && file_exists(__DIR__ . '/../.env')) {
        $envLines = @file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($envLines) {
            foreach ($envLines as $line) {
                $line = trim($line);
                if (strpos($line, '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    if (trim($k) === 'GEMINI_API_KEY') {
                        $envKey = trim($v, " \t\n\r\0\x0B\"'");
                        break;
                    }
                }
            }
        }
    }
    if ($envKey) {
        define('GEMINI_API_KEY', $envKey);
    }
}

if (!defined('GEMINI_MODEL')) {
    define('GEMINI_MODEL', 'gemini-2.5-flash');
}
