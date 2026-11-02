<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");
require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "error", "message" => "POST only"]);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    echo json_encode(["status" => "error", "message" => "Geen geldige gegevens ontvangen"]);
    exit;
}

$name = trim($input['name'] ?? 'Onbekend');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$date = trim($input['date'] ?? '');
$timeSlot = trim($input['timeSlot'] ?? '');
$appointmentType = trim($input['appointmentType'] ?? 'showroom');
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');
$source = trim($input['source'] ?? 'Website afspraakformulier');

if (empty($phone)) {
    echo json_encode(["status" => "error", "message" => "Telefoonnummer is verplicht"]);
    exit;
}

// 1. Zorg dat de appointments tabel bestaat
try {
    $pdo = getDBConnection();
    $pdo->exec("CREATE TABLE IF NOT EXISTS appointments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(150) NULL,
        date_pref VARCHAR(50) NULL,
        time_slot VARCHAR(50) NULL,
        appointment_type VARCHAR(50) DEFAULT 'showroom',
        address TEXT NULL,
        notes TEXT NULL,
        source VARCHAR(100) DEFAULT 'website',
        status VARCHAR(50) DEFAULT 'nieuw',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $stmt = $pdo->prepare("INSERT INTO appointments (name, phone, email, date_pref, time_slot, appointment_type, address, notes, source) 
                           VALUES (:name, :phone, :email, :date_pref, :time_slot, :type, :address, :notes, :source)");
    $stmt->execute([
        ':name' => $name,
        ':phone' => $phone,
        ':email' => $email,
        ':date_pref' => $date,
        ':time_slot' => $timeSlot,
        ':type' => $appointmentType,
        ':address' => $address,
        ':notes' => $notes,
        ':source' => $source
    ]);
} catch (Exception $dbErr) {
    // Log fout maar ga door naar bestand backup en e-mail
    error_log("DB error in book_appointment: " . $dbErr->getMessage());
}

// 2. Extra backup in bestand (zodat nooit een aanvraag kwijtraakt)
try {
    $backupFile = __DIR__ . '/appointments_log.json';
    $entry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'name' => $name,
        'phone' => $phone,
        'email' => $email,
        'date' => $date,
        'timeSlot' => $timeSlot,
        'appointmentType' => $appointmentType,
        'address' => $address,
        'notes' => $notes,
        'source' => $source
    ];
    $logData = [];
    if (file_exists($backupFile)) {
        $logData = json_decode(file_get_contents($backupFile), true) ?: [];
    }
    $logData[] = $entry;
    file_put_contents($backupFile, json_encode($logData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
} catch (Exception $fileErr) {
    error_log("File backup error: " . $fileErr->getMessage());
}

// 3. E-mail notificatie direct naar Geertjan en Matthias met herkenbare agenda/telefoon iconen
$to = "info@staopstoelen.nl, schipperwonen@gmail.com";

if (!empty($date) || !empty($timeSlot)) {
    $timeLabel = trim("$date $timeSlot");
    $subject = "📅 NIEUWE AFSPRAAK: $name ($phone)" . ($timeLabel ? " - $timeLabel" : "") . " - Staopstoelen.nl";
} else {
    $subject = "📞 TERUGBELVERZOEK: $name ($phone) - Staopstoelen.nl";
}

$msg = (!empty($date) || !empty($timeSlot))
    ? "📅 NIEUWE SHOWROOM-AFSPRAAK VIA STAOPSTOELEN.NL\n===================================================\n\n"
    : "📞 NIEUW TERUGBELVERZOEK VIA STAOPSTOELEN.NL\n===================================================\n\n";

$msg .= "👤 Naam: $name\n";
$msg .= "📞 Telefoonnummer: $phone\n";
$msg .= "✉️ E-mail: " . ($email ?: 'Niet opgegeven') . "\n";
$msg .= "📍 Type bezoek: " . ($appointmentType === 'home' ? 'Passing aan Huis' : 'Showroom Dordrecht (Merwedestraat 239)') . "\n";
if ($date) $msg .= "🗓️ Voorkeursdatum: $date\n";
if ($timeSlot) $msg .= "⏰ Tijdslot: $timeSlot\n";
if ($address) $msg .= "🏠 Adres: $address\n";
if ($notes) $msg .= "📝 Opmerkingen / Stoel: $notes\n";
$msg .= "🌐 Bron: $source\n";
$msg .= "⏱️ Tijdstip aanvraag: " . date('d-m-Y H:i:s') . "\n\n";
$msg .= "👉 ACTIE: Graag z.s.m. bellen op $phone om de afspraak te bevestigen!\n";

$headers = "From: staopstoelen.nl <info@staopstoelen.nl>\r\n";
$headers .= "Reply-To: " . ($email ?: 'info@staopstoelen.nl') . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

@mail($to, $subject, $msg, $headers);

echo json_encode([
    "status" => "success",
    "message" => "Afspraak succesvol ontvangen en opgeslagen."
]);
