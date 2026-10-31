<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed"]);
    exit;
}

// 1. Configuratie laden
require_once __DIR__ . '/gemini_config.php';

if (!defined('GEMINI_API_KEY') || empty(GEMINI_API_KEY)) {
    echo json_encode([
        "status" => "fallback",
        "message" => "Geen Gemini API sleutel ingesteld",
        "reply" => null
    ]);
    exit;
}

// 2. Beveiliging: Rate Limiter (max 30 verzoeken per minuut per IP)
$clientIp = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$clientIp = explode(',', $clientIp)[0];
$ipHash = md5(trim($clientIp));
$rateFile = sys_get_temp_dir() . '/staop_chat_rate_' . $ipHash . '.json';

$now = time();
$rateData = ['count' => 0, 'reset' => $now + 60];
if (file_exists($rateFile)) {
    $raw = @file_get_contents($rateFile);
    $parsed = json_decode($raw, true);
    if (is_array($parsed) && isset($parsed['reset']) && $parsed['reset'] > $now) {
        $rateData = $parsed;
    }
}

if ($rateData['count'] >= 30) {
    http_response_code(429);
    echo json_encode([
        "status" => "error",
        "message" => "Te veel vragen in korte tijd. Probeer het over een minuutje nog eens of neem direct telefonisch contact op.",
        "reply" => null
    ]);
    exit;
}

$rateData['count']++;
@file_put_contents($rateFile, json_encode($rateData));

// 3. Invoer valideren
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

$userMessage = trim($input['message'] ?? '');
if (empty($userMessage)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Bericht mag niet leeg zijn"]);
    exit;
}

if (mb_strlen($userMessage) > 800) {
    $userMessage = mb_substr($userMessage, 0, 800);
}

// Gespreksgeschiedenis inladen (maximaal laatste 6 beurten)
$rawHistory = is_array($input['history'] ?? null) ? $input['history'] : [];
$history = [];
foreach (array_slice($rawHistory, -6) as $turn) {
    if (!isset($turn['role']) || !isset($turn['text'])) continue;
    $role = ($turn['role'] === 'user' || $turn['role'] === 'model') ? $turn['role'] : 'user';
    $text = trim(strval($turn['text']));
    if (!empty($text)) {
        $history[] = [
            "role" => $role,
            "parts" => [["text" => mb_substr($text, 0, 600)]]
        ];
    }
}

// 4. Actuele stoelenvoorraad ophalen voor context
$stockLines = [];
$loaded = false;

// Eerst proberen via MySQL (zonder harde exit)
try {
    $dbHost = 'localhost';
    $dbName = 'geertjan1_newwebsite';
    $dbUser = 'geertjan1_matthias';
    $dbPass = 'j)z5_Z%SODGW.kVM';
    
    $dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_TIMEOUT => 2,
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    $stmt = $pdo->query("SELECT name, brand, model, price, `condition`, specifications FROM chairs WHERE status = 'beschikbaar' OR status IS NULL ORDER BY created_at DESC LIMIT 25");
    $chairs = $stmt->fetchAll();
    if (!empty($chairs)) {
        foreach ($chairs as $c) {
            $priceStr = !empty($c['price']) ? "€ " . number_format($c['price'], 0, ',', '.') . ",-" : "Prijs op aanvraag";
            $cond = !empty($c['condition']) ? ucfirst($c['condition']) : "Occasion";
            $specs = !empty($c['specifications']) ? (is_array($c['specifications']) ? $c['specifications'] : json_decode($c['specifications'], true)) : [];
            $motoren = $specs['Aantal motoren'] ?? '';
            $extra = $motoren ? " ({$motoren})" : "";
            $stockLines[] = "- {$c['name']} ({$c['brand']}) | {$cond} | {$priceStr}{$extra}";
        }
        $loaded = true;
    }
} catch (Throwable $t) {
    $loaded = false;
}

// Fallback naar database.json
if (!$loaded) {
    $jsonFile = __DIR__ . '/../database.json';
    if (file_exists($jsonFile)) {
        $data = json_decode(@file_get_contents($jsonFile), true);
        if (!empty($data['staopstoelen'])) {
            $count = 0;
            foreach ($data['staopstoelen'] as $c) {
                if (isset($c['status']) && $c['status'] !== 'beschikbaar') continue;
                $priceStr = !empty($c['price']) ? "€ " . number_format($c['price'], 0, ',', '.') . ",-" : "Prijs op aanvraag";
                $cond = !empty($c['condition']) ? ucfirst($c['condition']) : "Occasion";
                $specs = $c['specifications'] ?? [];
                $motoren = $specs['Aantal motoren'] ?? '';
                $extra = $motoren ? " ({$motoren})" : "";
                $stockLines[] = "- {$c['name']} ({$c['brand']}) | {$cond} | {$priceStr}{$extra}";
                $count++;
                if ($count >= 25) break;
            }
        }
    }
}
$stockContext = !empty($stockLines) ? implode("\n", $stockLines) : "- Diverse Fitform, Doge en DFM modellen beschikbaar in de showroom.";

// 5. Systeeminstructie opbouwen
$systemPrompt = <<<SYS
Je bent de vriendelijke, deskundige en empathische "Digitale Zit-Assistent" van Staopstoelen.nl (onderdeel van Schipper Compact Wonen) in Dordrecht.

WIE WIJ ZIJN & ONZE EXPERTISE:
• Onze specialist is Geertjan Klein Haneveld, gediplomeerd Bewegingstechnoloog met ruim 30 jaar ervaring in ergonomisch zitten, lichaamshouding en sta-op stoelen.
• Showroom: Merwedestraat 239, 3313 TW Dordrecht.
• Showroomkenmerken: Ruim, gelijkvloers, rolstoeltoegankelijk en gratis parkeren direct voor de deur.
• Vaste openingstijden: Dinsdag t/m vrijdag van 10:00 tot 16:00 uur. Buiten deze openingstijden en op zaterdag altijd welkom op afspraak voor een rustige 1-op-1 zitmeting.
• Telefoon: 078 - 631 4858 (rechtstreeks contact met Geertjan).
• WhatsApp: 06 - 2223 2964.
• WERKGEBIED, SHOWROOM & PASSING AAN HUIS:
  - SHOWROOM IN DORDRECHT: Iedereen uit heel Nederland is van harte welkom in onze ruime showroom aan de Merwedestraat 239 in Dordrecht (gratis parkeren direct voor de deur, gelijkvloers).
  - PASSING AAN HUIS (UITSLUITEND REGIO DORDRECHT): Wij passen UITSLUITEND aan huis in de regio Dordrecht / Drechtsteden (o.a. Dordrecht, Zwijndrecht, Papendrecht, Sliedrecht, Alblasserdam, Hendrik-Ido-Ambacht en directe omgeving). Als iemand in deze regio woont en door verminderde mobiliteit of gezondheid niet naar Dordrecht kan komen, komt Geertjan vrijblijvend met stoelen aan huis proefpassen!
  - ZEER BELANGRIJK: Wij passen NIET aan huis in heel Nederland (dus niet in bijv. Amsterdam, Utrecht, Brabant of het noorden/oosten). Vraagstellers van buiten de regio Dordrecht nodigen we altijd van harte uit in onze showroom in Dordrecht!
  - BEZORGING: Een aangeschafte stoel bezorgen en installeren we uiteraard wél keurig netjes aan huis inclusief persoonlijke maatwerkafstelling.

ONZE KERNWAARDEN:
1. Zitten is Maatwerk: Een goede stoel moet altijd exact kloppen op 5 lichaamsmaten: zithoogte, zitdiepte, zitbreedte, armleggerhoogte en lendensteun. Zonder dit maatwerk ontstaat onderuitzakken en pijn in onderrug of nek.
2. Certified Fitform Occasions: Technisch 100% nagekeken volgens een strenge 15-punts keuring, geleverd met officieel keuringscertificaat, 1 jaar volledige garantie aan huis en gratis thuisbezorging & maatwerkafstelling. Prijsrange: ca. € 695,- tot € 1.495,- (een fractie van de nieuwprijs van € 3.500+).
3. Nieuwe sta-op stoelen: Leverbaar van A-merken zoals Fitform, Doge, DFM en Mecam, volledig naar wens geconfigureerd.
4. Vergoedingen (Wmo / Zorgverzekering): In enkele gevallen mogelijk, maar kent strenge criteria en lange wachttijden. Veel klanten kiezen daarom voor een direct leverbare Certified occasion.

SELECTIE UIT ONZE ACTUELE VOORRAAD IN DORDRECHT:
{$stockContext}

RICHTLIJNEN VOOR JE ANTWOORD:
• Spreek de bezoeker altijd respectvol en vriendelijk aan met "u".
• Schrijf helder, warm en geruststellend (gericht op senioren en betrokken kinderen/mantelzorgers).
• Houd antwoorden beknopt en vlot leesbaar (maximaal 2 tot 3 alinea's). Geen overdreven lange essays.
• Noem gerust concrete modellen of prijzen als de vraag daarover gaat.
• Sluit vriendelijk af met het aanbieden van een vrijblijvende zitmeting/proefzitten in onze showroom in Dordrecht (of bij cliënten in de regio Dordrecht eventueel gratis aan huis) of persoonlijk advies van Geertjan.
• Voeg aan het allerlaatste einde van je tekst op een nieuwe regel 1 of 2 actie-tags toe (kies wat het meest logisch is):
  [afspraak]  -> als proefzitten of afspraak passend is
  [keuzehulp] -> als er gevraagd wordt naar maten, modellen of keuzehulp
  [collectie] -> als er gevraagd wordt naar prijzen of voorraad
  [bellen]    -> als direct bellen met Geertjan passend is
  [whatsapp]  -> voor snel laagdrempelig contact via WhatsApp
SYS;

// 6. Gemini API verzoek samenstellen
$contents = $history;
$contents[] = [
    "role" => "user",
    "parts" => [["text" => $userMessage]]
];

$payload = [
    "systemInstruction" => [
        "parts" => [["text" => $systemPrompt]]
    ],
    "contents" => $contents,
    "generationConfig" => [
        "temperature" => 0.65,
        "maxOutputTokens" => 650,
        "thinkingConfig" => [
            "thinkingBudget" => 0
        ]
    ]
];

$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" . GEMINI_MODEL . ":generateContent?key=" . GEMINI_API_KEY;

$ch = curl_init($apiUrl);
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($payload),
    CURLOPT_TIMEOUT => 9,
    CURLOPT_CONNECTTIMEOUT => 4,
    CURLOPT_SSL_VERIFYPEER => true
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    echo json_encode([
        "status" => "fallback",
        "http_code" => $httpCode,
        "error" => $curlErr ?: "Gemini API HTTP " . $httpCode,
        "reply" => null
    ]);
    exit;
}

$geminiData = json_decode($response, true);
$replyText = $geminiData['candidates'][0]['content']['parts'][0]['text'] ?? '';

if (empty($replyText)) {
    echo json_encode([
        "status" => "fallback",
        "reply" => null
    ]);
    exit;
}

// 7. Actie-tags detecteren en opschonen
$actions = [];
if (preg_match_all('/\[(afspraak|keuzehulp|collectie|bellen|whatsapp)\]/i', $replyText, $matches)) {
    $actions = array_unique(array_map('strtolower', $matches[1]));
    $replyText = trim(preg_replace('/\[(afspraak|keuzehulp|collectie|bellen|whatsapp)\]/i', '', $replyText));
}

echo json_encode([
    "status" => "success",
    "reply" => $replyText,
    "actions" => array_values($actions)
], JSON_UNESCAPED_UNICODE);
