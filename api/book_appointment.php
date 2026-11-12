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

$action = trim($input['action'] ?? '');
$name = trim($input['name'] ?? 'Onbekend');
$phone = trim($input['phone'] ?? '');
$email = trim($input['email'] ?? '');
$date = trim($input['date'] ?? '');
$dateIso = trim($input['dateIso'] ?? '');
$timeSlot = trim($input['timeSlot'] ?? '');
$startTime = trim($input['startTime'] ?? '');
$endTime = trim($input['endTime'] ?? '');
$appointmentType = trim($input['appointmentType'] ?? 'showroom');
$address = trim($input['address'] ?? '');
$notes = trim($input['notes'] ?? '');
$source = trim($input['source'] ?? 'Website afspraakformulier');

// Normaliseer datum naar YYYY-MM-DD voor Google Agenda en Nederlandse datumweergave
if (empty($dateIso) && !empty($date)) {
    if (preg_match('/^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/', $date, $m)) {
        $dateIso = sprintf('%04d-%02d-%02d', (int)$m[3], (int)$m[2], (int)$m[1]);
    } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
        $dateIso = $date;
    }
}

if ((empty($startTime) || empty($endTime)) && strpos($timeSlot, ' - ') !== false) {
    $parts = explode(' - ', $timeSlot, 2);
    if (empty($startTime)) $startTime = trim($parts[0]);
    if (empty($endTime)) $endTime = trim($parts[1]);
}

function sendCustomerConfirmationMail($name, $phone, $email, $dateRaw, $dateIso, $timeSlot, $startTime, $endTime, $appointmentType, $address, $notes) {
    $cleanEmail = trim($email);
    if (empty($cleanEmail) || strtolower($cleanEmail) === 'belmij@staopstoelen.nl' || !filter_var($cleanEmail, FILTER_VALIDATE_EMAIL)) {
        return false;
    }

    $isHome = ($appointmentType === 'home' || $appointmentType === 'thuis');
    $typeLabel = $isHome ? 'Passing aan Huis' : 'Showroombezoek Dordrecht';
    $locationStr = $isHome
        ? ($address ?: 'Bij u thuis')
        : 'Merwedestraat 239, 3313 GT Dordrecht';

    // Formatteer Nederlandse datum (bijv. "woensdag 18 november 2026")
    $formattedDate = $dateRaw;
    $gcalUrl = '';
    if (!empty($dateIso) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateIso)) {
        try {
            $tz = new DateTimeZone('Europe/Amsterdam');
            $dt = new DateTime($dateIso, $tz);
            $dagen = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];
            $maanden = [1 => 'januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
            $formattedDate = $dagen[(int)$dt->format('w')] . ' ' . (int)$dt->format('j') . ' ' . $maanden[(int)$dt->format('n')] . ' ' . $dt->format('Y');

            if (!empty($startTime) && !empty($endTime) && preg_match('/^\d{1,2}:\d{2}$/', $startTime) && preg_match('/^\d{1,2}:\d{2}$/', $endTime)) {
                $utc = new DateTimeZone('UTC');
                $dtStart = new DateTime("$dateIso $startTime:00", $tz);
                $dtEnd = new DateTime("$dateIso $endTime:00", $tz);
                $dtStart->setTimezone($utc);
                $dtEnd->setTimezone($utc);
                $gcalDates = $dtStart->format('Ymd\THis\Z') . '/' . $dtEnd->format('Ymd\THis\Z');
                $gcalTitle = rawurlencode("$typeLabel - Staopstoelen.nl");
                $gcalDetails = rawurlencode("Afspraak met Bewegingstechnoloog Geertjan Klein Haneveld.\nType: $typeLabel\nLocatie: $locationStr\nContact: 06 - 22 23 29 64 / 078 - 631 4858\nWebsite: https://staopstoelen.nl");
                $gcalLocation = rawurlencode($locationStr);
                $gcalUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE&text={$gcalTitle}&dates={$gcalDates}&details={$gcalDetails}&location={$gcalLocation}";
            }
        } catch (Throwable $e) {}
    }

    $hasSchedule = (!empty($formattedDate) && !empty($timeSlot));
    if ($hasSchedule) {
        $timeShort = !empty($startTime) ? $startTime : $timeSlot;
        $subject = $isHome
            ? "Bevestiging passing aan huis: $formattedDate om $timeShort uur - Staopstoelen.nl"
            : "Bevestiging afspraak Showroom Dordrecht: $formattedDate om $timeShort uur - Staopstoelen.nl";
    } else {
        $subject = "Bevestiging van uw aanvraag - Staopstoelen.nl";
    }

    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeType = htmlspecialchars($typeLabel, ENT_QUOTES, 'UTF-8');
    $safeDate = htmlspecialchars($formattedDate, ENT_QUOTES, 'UTF-8');
    $safeSlot = htmlspecialchars($timeSlot, ENT_QUOTES, 'UTF-8');
    $safeLoc  = htmlspecialchars($locationStr, ENT_QUOTES, 'UTF-8');
    $safePhone = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
    $safeNotes = nl2br(htmlspecialchars($notes, ENT_QUOTES, 'UTF-8'));

    $custHtml = '<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>' . htmlspecialchars($subject, ENT_QUOTES, 'UTF-8') . '</title></head>
<body style="margin:0; padding:20px 12px; background-color:#f4f7f3; font-family:Arial, Helvetica, sans-serif; color:#222222;">
  <div style="font-family:Arial, Helvetica, sans-serif; font-size:15px; line-height:1.6; color:#222222; max-width:600px; margin:0 auto; padding:28px 26px; background-color:#ffffff; border-radius:14px; border:1px solid #e2ece0;">
    <div style="margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid #e8e8e8;">
      <a href="https://staopstoelen.nl" target="_blank" style="text-decoration:none; display:inline-block;">
        <img src="https://staopstoelen.nl/assets/logo_email_website.png" alt="staopstoelen.nl - Specialist in Ergonomisch Zitcomfort" width="260" style="display:block; border:0; width:260px; height:auto; max-width:100%;">
      </a>
    </div>

    <p style="margin:0 0 16px 0; color:#222222;">Beste ' . $safeName . ',</p>
    <p style="margin:0 0 20px 0; color:#333333;">
      Hartelijk dank voor uw aanvraag bij <strong>Staopstoelen.nl</strong>. Uw ' . ($hasSchedule ? 'afspraak staat bij ons genoteerd' : 'aanvraag is goed ontvangen') . ' met de volgende gegevens:
    </p>

    <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:14px; line-height:1.6;">
      <tr>
        <td style="padding:7px 0; color:#666666; width:140px; vertical-align:top;">Type afspraak:</td>
        <td style="padding:7px 0; color:#111111; font-weight:bold;">' . $safeType . '</td>
      </tr>' .
      (!empty($safeDate) ? '
      <tr>
        <td style="padding:7px 0; color:#666666; vertical-align:top; border-top:1px solid #f1f5f9;">Datum:</td>
        <td style="padding:7px 0; color:#111111; font-weight:bold; border-top:1px solid #f1f5f9;">' . $safeDate . '</td>
      </tr>' : '') .
      (!empty($safeSlot) ? '
      <tr>
        <td style="padding:7px 0; color:#666666; vertical-align:top; border-top:1px solid #f1f5f9;">Tijdstip:</td>
        <td style="padding:7px 0; color:#111111; font-weight:bold; border-top:1px solid #f1f5f9;">' . $safeSlot . ' uur</td>
      </tr>' : '') . '
      <tr>
        <td style="padding:7px 0; color:#666666; vertical-align:top; border-top:1px solid #f1f5f9;">Adres / Locatie:</td>
        <td style="padding:7px 0; color:#111111; border-top:1px solid #f1f5f9;">
          ' . $safeLoc .
          (!$isHome ? '
          <div style="margin-top:4px;">
            <a href="https://www.google.com/maps/dir/?api=1&amp;destination=Merwedestraat+239,+Dordrecht" target="_blank" style="color:#4b8f24; font-size:13px; font-weight:700; text-decoration:underline;">
              Route plannen in Google Maps &rarr;
            </a>
          </div>' : '') . '
        </td>
      </tr>
      <tr>
        <td style="padding:7px 0; color:#666666; vertical-align:top; border-top:1px solid #f1f5f9;">Telefoonnummer:</td>
        <td style="padding:7px 0; color:#111111; border-top:1px solid #f1f5f9;">' . $safePhone . '</td>
      </tr>' .
      (!empty($notes) && $notes !== '-' ? '
      <tr>
        <td style="padding:7px 0; color:#666666; vertical-align:top; border-top:1px solid #f1f5f9;">Uw opmerkingen:</td>
        <td style="padding:7px 0; color:#111111; border-top:1px solid #f1f5f9;">' . $safeNotes . '</td>
      </tr>' : '') . '
    </table>' .
    (!empty($gcalUrl) ? '
    <div style="margin:20px 0 24px 0; padding:14px 18px; background-color:#f7faf5; border:1px solid #d5e5cf; border-radius:8px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle; padding-right:12px;">
            <div style="font-size:13.5px; color:#2e5714; font-weight:700;">Wilt u deze afspraak direct opslaan?</div>
            <div style="font-size:12.5px; color:#555555; margin-top:2px;">Voeg de afspraak met één klik toe aan uw Google Agenda.</div>
          </td>
          <td style="vertical-align:middle; text-align:right; width:190px;">
            <a href="' . htmlspecialchars($gcalUrl, ENT_QUOTES, 'UTF-8') . '" target="_blank" style="background-color:#4b8f24; color:#ffffff; padding:9px 15px; border-radius:6px; font-size:13px; font-weight:bold; text-decoration:none; display:inline-block; white-space:nowrap;">+ In Google Agenda</a>
          </td>
        </tr>
      </table>
    </div>' : '') . '

    <p style="margin:20px 0 6px 0; font-weight:bold; color:#111111;">Hoe nu verder?</p>
    <p style="margin:0 0 20px 0; color:#333333;">
      Ik neem telefonisch contact met u op om de afspraak persoonlijk te bevestigen en eventuele wensen alvast door te nemen.
    </p>' .
    (!$isHome ? '
    <p style="margin:20px 0 6px 0; font-weight:bold; color:#111111;">Praktische informatie showroombezoek:</p>
    <p style="margin:0 0 14px 0; color:#333333;">
      Adres: <strong>Merwedestraat 239, 3313 GT Dordrecht</strong>.<br>
      U kunt gratis direct voor de deur parkeren. Onze showroom is gelijkvloers en rolstoeltoegankelijk — de koffie staat voor u klaar!
    </p>' : '') . '

    <div style="margin-top:28px; padding-top:20px; border-top:1px solid #e8ece6; color:#111111; font-size:14px; line-height:1.6;">
      <p style="margin:0 0 14px 0;">Met vriendelijke groet,</p>
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0; padding:0;">
        <tr>
          <td style="vertical-align:top; padding-right:18px; width:84px;">
            <img src="https://staopstoelen.nl/assets/geert_avatar.png" alt="Geertjan Klein Haneveld" width="84" height="84" style="display:block; width:84px; height:84px; border-radius:50%; border:1px solid #d5ded0; object-fit:cover;">
          </td>
          <td style="vertical-align:top; font-size:14px; line-height:1.5; color:#111111;">
            <div style="font-size:16px; font-weight:bold; color:#111111; margin-bottom:2px;">Geertjan Klein Haneveld</div>
            <div style="font-size:13px; color:#444444; font-weight:600; margin-bottom:8px;">Gediplomeerd bewegingstechnoloog &amp; Certified Fitform Specialist</div>
            <div style="font-size:13px; line-height:1.6; color:#222222;">
              078 - 631 4858 &nbsp;&bull;&nbsp; 06 - 22 23 29 64 (ook WhatsApp)<br>
              <a href="mailto:info@staopstoelen.nl" style="color:#2e5714; text-decoration:none; font-weight:600;">info@staopstoelen.nl</a> &nbsp;&bull;&nbsp; <a href="https://staopstoelen.nl" target="_blank" style="color:#2e5714; text-decoration:none;">www.staopstoelen.nl</a><br>
              Showroom: Merwedestraat 239, 3313 GT Dordrecht
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>';

    $custHeaders  = "MIME-Version: 1.0\r\n";
    $custHeaders .= "Content-Type: text/html; charset=UTF-8\r\n";
    $custHeaders .= "From: Geertjan Klein Haneveld - Staopstoelen.nl <info@staopstoelen.nl>\r\n";
    $custHeaders .= "Reply-To: info@staopstoelen.nl\r\n";
    $custHeaders .= "Bcc: info@staopstoelen.nl, schipperwonen@gmail.com\r\n";
    $custHeaders .= "X-Mailer: PHP/" . phpversion() . "\r\n";

    return @mail($cleanEmail, $subject, $custHtml, $custHeaders);
}

// Veilige resend-actie voor een reeds geregistreerde afspraak in appointments_log.json
if ($action === 'resend_confirmation') {
    $backupFile = __DIR__ . '/appointments_log.json';
    $matched = null;
    if (file_exists($backupFile)) {
        $entries = json_decode(file_get_contents($backupFile), true) ?: [];
        foreach (array_reverse($entries) as $item) {
            if (!empty($item['email']) && strtolower(trim($item['email'])) === strtolower($email) &&
                preg_replace('/\D+/', '', $item['phone'] ?? '') === preg_replace('/\D+/', '', $phone)) {
                $matched = $item;
                break;
            }
        }
    }
    if (!$matched) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Geen overeenkomende afspraak gevonden."]);
        exit;
    }
    $mDate = $matched['date'] ?? $date;
    $mIso = '';
    if (preg_match('/^(\d{1,2})[-.\/](\d{1,2})[-.\/](\d{4})$/', $mDate, $mm)) {
        $mIso = sprintf('%04d-%02d-%02d', (int)$mm[3], (int)$mm[2], (int)$mm[1]);
    } elseif (preg_match('/^\d{4}-\d{2}-\d{2}$/', $mDate)) {
        $mIso = $mDate;
    }
    $mSlot = $matched['timeSlot'] ?? $timeSlot;
    $mStart = '';
    $mEnd = '';
    if (strpos($mSlot, ' - ') !== false) {
        [$mStart, $mEnd] = array_map('trim', explode(' - ', $mSlot, 2));
    }
    $sent = sendCustomerConfirmationMail(
        $matched['name'] ?? $name,
        $matched['phone'] ?? $phone,
        $matched['email'],
        $mDate,
        $mIso,
        $mSlot,
        $mStart,
        $mEnd,
        $matched['appointmentType'] ?? 'showroom',
        $matched['address'] ?? '',
        $matched['notes'] ?? ''
    );
    echo json_encode(["status" => $sent ? "success" : "error", "confirmation_sent" => (bool)$sent]);
    exit;
}

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

// 3b. Bevestigingsmail rechtstreeks naar de klant vanaf info@staopstoelen.nl (met Bcc naar ons team)
$customerConfirmationSent = sendCustomerConfirmationMail(
    $name,
    $phone,
    $email,
    $date,
    $dateIso,
    $timeSlot,
    $startTime,
    $endTime,
    $appointmentType,
    $address,
    $notes
);

// 4. Server-side synchronisatie met Google Agenda (Google Apps Script Web App)
// Zo raakt een boeking nooit meer kwijt als de browser direct doorstuurt naar bedankt.html of adblockers gebruikt.
$calendarSynced = false;
$gcalWebhookUrl = "https://script.google.com/macros/s/AKfycbwyRN-iLM83LFZ4hZ08jzwpMdeHI6o5kU5fr0Bz2KpmOuG3XP5y_4zbyE2cO45WCdNN/exec";

if (!empty($gcalWebhookUrl) && function_exists('curl_init')) {
    try {
        $cleanCustomerEmail = (!empty($email) && strtolower($email) !== 'belmij@staopstoelen.nl') ? $email : '';
        $notesForCalendar = !empty($notes) ? $notes : ($source ? "Bron: $source" : '-');
        if (!empty($cleanCustomerEmail) && strpos($notesForCalendar, $cleanCustomerEmail) === false) {
            $notesForCalendar .= "\nE-mail klant: " . $cleanCustomerEmail;
        }
        $gcalPayload = [
            'brand' => 'staopstoelen',
            'site' => 'staopstoelen.nl',
            'name' => $name,
            'phone' => $phone,
            'email' => '', // Klantbevestiging is hierboven al verzonden vanaf info@staopstoelen.nl (voorkomt dubbele mail)
            'date' => $dateIso,
            'timeSlot' => $timeSlot,
            'startTime' => $startTime,
            'endTime' => $endTime,
            'appointmentType' => $appointmentType,
            'address' => !empty($address) ? $address : ($appointmentType === 'home' ? '' : 'Merwedestraat 239, 3313 GT Dordrecht'),
            'notes' => $notesForCalendar,
            'senderName' => 'Geertjan Klein Haneveld - Staopstoelen.nl',
            'replyTo' => 'info@staopstoelen.nl',
            'notificationEmail' => 'schipperwonen@gmail.com, info@staopstoelen.nl',
            'timestamp' => gmdate('c')
        ];

        $ch = curl_init($gcalWebhookUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: text/plain;charset=utf-8'],
            CURLOPT_POSTFIELDS => json_encode($gcalPayload, JSON_UNESCAPED_UNICODE),
            CURLOPT_TIMEOUT => 12,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_SSL_VERIFYPEER => true
        ]);
        $gcalResp = curl_exec($ch);
        $gcalCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($gcalResp !== false && $gcalCode >= 200 && $gcalCode < 400 && (strpos($gcalResp, '"success"') !== false || $gcalCode === 302)) {
            $calendarSynced = true;
        }
    } catch (Throwable $gcalErr) {
        error_log("Google Calendar webhook error: " . $gcalErr->getMessage());
    }
}

echo json_encode([
    "status" => "success",
    "calendar_synced" => $calendarSynced,
    "confirmation_sent" => $customerConfirmationSent,
    "message" => "Afspraak succesvol ontvangen en opgeslagen."
]);
