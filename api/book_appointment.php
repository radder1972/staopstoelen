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

// 3. E-mail notificatie direct naar Geertjan en Matthias met onze huisstijl iconen
$to = "info@staopstoelen.nl, schipperwonen@gmail.com";

$isAppointment = (!empty($date) || !empty($timeSlot));
$timeLabel = trim("$date $timeSlot");

if ($isAppointment) {
    $subject = "📅 NIEUWE AFSPRAAK: $name ($phone)" . ($timeLabel ? " - $timeLabel" : "") . " - Staopstoelen.nl";
} else {
    $subject = "📞 TERUGBELVERZOEK: $name ($phone) - Staopstoelen.nl";
}

$locatieLabel = ($appointmentType === 'home' ? 'Passing aan Huis' : 'Showroom Dordrecht (Merwedestraat 239)');

// HTML E-mail met officiële merkiconen van Staopstoelen.nl
$htmlMsg = '
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>' . htmlspecialchars($subject) . '</title>
</head>
<body style="margin:0; padding:20px 10px; background-color:#f1f5f0; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; color:#1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:620px; margin:0 auto; background-color:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 6px 24px rgba(0,0,0,0.07); border:1px solid #e2ece0;">
    
    <!-- HEADER MET VET LOGO -->
    <tr>
      <td style="padding:26px 30px 20px 30px; background-color:#ffffff; border-bottom:2px solid #eef3ec; text-align:left;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td style="vertical-align:middle;">
              <a href="https://staopstoelen.nl" target="_blank" style="text-decoration:none;">
                <img src="https://staopstoelen.nl/assets/logo_email_website.png" alt="staopstoelen.nl" width="220" style="display:block; border:0; width:220px; max-width:100%; height:auto;">
              </a>
            </td>
            <td style="vertical-align:middle; text-align:right;">
              <span style="display:inline-block; background-color:#edf6ea; color:#2e6819; font-weight:800; font-size:11px; padding:6px 12px; border-radius:20px; text-transform:uppercase; letter-spacing:0.8px; border:1px solid #d4e7d0;">
                ' . ($isAppointment ? '📅 Nieuwe Boeking' : '📞 Terugbelverzoek') . '
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- HOOFD BANNER CARD -->
    <tr>
      <td style="padding:28px 30px 10px 30px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:' . ($isAppointment ? '#f0f7ee' : '#fff7ed') . '; border:2px solid ' . ($isAppointment ? '#d5ebd1' : '#ffedd5') . '; border-radius:14px; padding:18px 20px;">
          <tr>
            <td width="48" style="vertical-align:middle; padding-right:16px;">
              <img src="https://staopstoelen.nl/assets/email_icons/' . ($isAppointment ? 'agenda_badge.png' : 'phone_badge.png') . '" width="46" height="46" alt="Icon" style="display:block; width:46px; height:46px; border-radius:50%;">
            </td>
            <td style="vertical-align:middle;">
              <div style="font-size:13px; font-weight:800; text-transform:uppercase; letter-spacing:0.8px; color:' . ($isAppointment ? '#2e6819' : '#c2410c') . ';">
                ' . ($isAppointment ? 'Nieuwe Showroom Afspraak' : 'Dringend Terugbelverzoek') . '
              </div>
              <div style="font-size:19px; font-weight:900; color:#0f172a; margin-top:2px;">
                ' . htmlspecialchars($name) . '
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- DETAILS LIJST MET AUTHENTIEKE ICONEN -->
    <tr>
      <td style="padding:15px 30px 25px 30px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size:14.5px; line-height:1.6;">
          
          <!-- TELEFOON -->
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle;">
              <img src="https://staopstoelen.nl/assets/email_icons/phone_badge.png" width="30" height="30" alt="Telefoon" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; width:120px;">Telefoon:</td>
            <td style="padding:10px 0; vertical-align:middle; font-weight:800; font-size:16px; color:#0f172a;">
              <a href="tel:' . preg_replace('/[^0-9+]/', '', $phone) . '" style="color:#2e6819; text-decoration:none;">' . htmlspecialchars($phone) . '</a>
            </td>
          </tr>

          <!-- DATUM & TIJD (indien afspraak) -->
          ' . ($isAppointment ? '
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle; border-top:1px solid #f1f5f9;">
              <img src="https://staopstoelen.nl/assets/email_icons/agenda_badge.png" width="30" height="30" alt="Agenda" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; border-top:1px solid #f1f5f9;">Gekozen tijdstip:</td>
            <td style="padding:10px 0; vertical-align:middle; font-weight:800; color:#0f172a; border-top:1px solid #f1f5f9;">
              ' . htmlspecialchars($date) . ' om ' . htmlspecialchars($timeSlot) . '
            </td>
          </tr>' : '') . '

          <!-- LOCATIE -->
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle; border-top:1px solid #f1f5f9;">
              <img src="https://staopstoelen.nl/assets/email_icons/location_badge.png" width="30" height="30" alt="Locatie" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; border-top:1px solid #f1f5f9;">Locatie:</td>
            <td style="padding:10px 0; vertical-align:middle; font-weight:700; color:#0f172a; border-top:1px solid #f1f5f9;">
              ' . htmlspecialchars($locatieLabel) . '
            </td>
          </tr>

          <!-- E-MAIL -->
          ' . (!empty($email) ? '
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle; border-top:1px solid #f1f5f9;">
              <img src="https://staopstoelen.nl/assets/email_icons/user_badge.png" width="30" height="30" alt="E-mail" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; border-top:1px solid #f1f5f9;">E-mailadres:</td>
            <td style="padding:10px 0; vertical-align:middle; color:#334155; border-top:1px solid #f1f5f9;">
              <a href="mailto:' . htmlspecialchars($email) . '" style="color:#0f172a; text-decoration:underline;">' . htmlspecialchars($email) . '</a>
            </td>
          </tr>' : '') . '

          <!-- ADRES (indien thuispassing) -->
          ' . (!empty($address) ? '
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle; border-top:1px solid #f1f5f9;">
              <img src="https://staopstoelen.nl/assets/email_icons/location_badge.png" width="30" height="30" alt="Adres" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; border-top:1px solid #f1f5f9;">Klantadres:</td>
            <td style="padding:10px 0; vertical-align:middle; color:#0f172a; border-top:1px solid #f1f5f9;">
              ' . nl2br(htmlspecialchars($address)) . '
            </td>
          </tr>' : '') . '

          <!-- OPMERKINGEN / STOEL -->
          ' . (!empty($notes) ? '
          <tr>
            <td width="40" style="padding:10px 0; vertical-align:middle; border-top:1px solid #f1f5f9;">
              <img src="https://staopstoelen.nl/assets/email_icons/notes_badge.png" width="30" height="30" alt="Notities" style="display:block; width:30px; height:30px; border-radius:50%;">
            </td>
            <td style="padding:10px 0 10px 10px; vertical-align:middle; color:#64748b; border-top:1px solid #f1f5f9;">Opmerkingen:</td>
            <td style="padding:10px 0; vertical-align:middle; color:#334155; border-top:1px solid #f1f5f9; font-style:italic;">
              "' . nl2br(htmlspecialchars($notes)) . '"
            </td>
          </tr>' : '') . '

        </table>

        <!-- DIRECT BEL-KNOP ACTIE VOOR GEERTJAN / MATTHIAS -->
        <div style="margin-top:28px; text-align:center;">
          <a href="tel:' . preg_replace('/[^0-9+]/', '', $phone) . '" style="display:inline-block; background-color:#f39223; color:#ffffff; font-size:16px; font-weight:800; text-decoration:none; padding:15px 32px; border-radius:30px; box-shadow:0 4px 15px rgba(243, 146, 35, 0.4); letter-spacing:0.3px;">
            📞 Bel ' . htmlspecialchars($name) . ' Nu Direct: ' . htmlspecialchars($phone) . '
          </a>
        </div>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="padding:18px 30px; background-color:#f8faf8; border-top:1px solid #e2ece0; text-align:center; font-size:12px; color:#64748b;">
        Ontvangen via <strong>staopstoelen.nl</strong> &bull; Showroom: Merwedestraat 239, 3313 GT Dordrecht &bull; Tel: 078 - 631 4858
      </td>
    </tr>

  </table>
</body>
</html>
';

// Headers voor HTML mail
$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers .= "From: staopstoelen.nl <info@staopstoelen.nl>\r\n";
$headers .= "Reply-To: " . ($email ?: 'info@staopstoelen.nl') . "\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";

@mail($to, $subject, $htmlMsg, $headers);

echo json_encode([
    "status" => "success",
    "message" => "Afspraak succesvol ontvangen en opgeslagen."
]);
