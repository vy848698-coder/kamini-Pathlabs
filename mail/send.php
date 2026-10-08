<?php
/* ==========================================================
   KAMINI CLINIC & LABS — mail/send.php
   The one server-side file the site has. Every form posts here:
   the booking form on the home, doctors and home collection
   pages, and the contact enquiry. It checks the details again
   (assets/js/forms.js has already checked them in the browser,
   but anyone can post here directly), then emails them to the
   clinic over SMTP with PHPMailer.

   Two kinds of caller:
     - forms.js sends JSON and gets JSON back;
     - a browser with JavaScript off posts the form itself and
       gets a small thank-you (or what-went-wrong) page.

   Settings — the SMTP login, who receives the mail — live in
   mail/config.php, which is never committed. Copy
   config.sample.php to config.php and fill it in.

   Needs PHP 7.4 or newer with mbstring and openssl.
========================================================== */
declare(strict_types=1);

/* a PHP warning in the middle of a JSON reply would break it for the visitor */
ini_set('display_errors', '0');

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as MailException;

require __DIR__ . '/lib/PHPMailer/Exception.php';
require __DIR__ . '/lib/PHPMailer/PHPMailer.php';
require __DIR__ . '/lib/PHPMailer/SMTP.php';

const DESK_PHONE = '+91 98614 51521';

/* ---------- what each form sends ----------
   The key is the form's data-form attribute; the list is the named
   fields in the order they should read in the email. A field that is
   not listed here is ignored, whatever the browser sends. */
const FORMS = [
    'home'       => ['title' => 'Callback request',        'page' => 'Home page',              'fields' => ['name', 'phone', 'time', 'service']],
    'doctors'    => ['title' => 'Consultation request',    'page' => 'Our Doctors page',       'fields' => ['name', 'phone', 'day', 'doctor']],
    'collection' => ['title' => 'Home collection booking', 'page' => 'Home Collection page',   'fields' => ['name', 'phone', 'locality', 'day', 'slot', 'tests']],
    'contact'    => ['title' => 'Contact enquiry',         'page' => 'Contact page',           'fields' => ['name', 'phone', 'email', 'topic', 'when', 'message']],
];

/* How each field is checked, and what it is called in the email.
   `choice` is a select: anything short and single-line is accepted, so
   renaming an option on a page never starts losing requests. */
const FIELDS = [
    'name'     => ['label' => 'Name',             'rule' => 'name'],
    'phone'    => ['label' => 'Mobile',           'rule' => 'phone'],
    'email'    => ['label' => 'Email',            'rule' => 'email'],
    'locality' => ['label' => 'Locality',         'rule' => 'locality'],
    'message'  => ['label' => 'Message',          'rule' => 'message'],
    'tests'    => ['label' => 'Tests chosen',     'rule' => 'text'],
    'time'     => ['label' => 'Preferred time',   'rule' => 'choice'],
    'service'  => ['label' => 'Needs',            'rule' => 'choice'],
    'day'      => ['label' => 'Day',              'rule' => 'choice'],
    'doctor'   => ['label' => 'Consultant',       'rule' => 'choice'],
    'slot'     => ['label' => 'Slot',             'rule' => 'choice'],
    'topic'    => ['label' => 'About',            'rule' => 'choice'],
    'when'     => ['label' => 'Best time to call', 'rule' => 'choice'],
];

/* The same slips forms.js catches, for visitors without JavaScript. */
const EMAIL_TYPOS = [
    'gmial.com' => 'gmail.com', 'gmai.com' => 'gmail.com', 'gamil.com' => 'gmail.com', 'gmaill.com' => 'gmail.com',
    'gnail.com' => 'gmail.com', 'gmal.com' => 'gmail.com', 'gmail.co' => 'gmail.com', 'gmail.con' => 'gmail.com',
    'gmail.cm' => 'gmail.com', 'gmail.om' => 'gmail.com', 'gmail.comm' => 'gmail.com', 'gmail.in' => 'gmail.com',
    'gmail.co.in' => 'gmail.com', 'yaho.com' => 'yahoo.com', 'yahoo.con' => 'yahoo.com', 'yahooo.com' => 'yahoo.com',
    'yahoo.in' => 'yahoo.co.in', 'yaho.co.in' => 'yahoo.co.in', 'hotmial.com' => 'hotmail.com', 'hotmail.con' => 'hotmail.com',
    'outlok.com' => 'outlook.com', 'outlook.con' => 'outlook.com', 'rediffmail.con' => 'rediffmail.com',
    'redifmail.com' => 'rediffmail.com', 'icloud.con' => 'icloud.com',
];

const MAX_BODY = 16384;   /* the largest honest submission is well under 3 KB */

/* ==========================================================
   1. ANSWERING
========================================================== */
$wantsJson = stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false
          || stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(int $status, array $body): void
{
    global $wantsJson;
    http_response_code($status);
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    if ($wantsJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    /* JavaScript is off, so the visitor landed here: give them a page */
    header('Content-Type: text/html; charset=utf-8');
    $ok = !empty($body['ok']);
    $lines = [];
    if ($ok) {
        $lines[] = 'Thank you — your request is with the desk. We will call you back shortly.';
    } elseif (!empty($body['errors'])) {
        $lines[] = 'A few details need fixing. Please go back and correct:';
        foreach ($body['errors'] as $msg) $lines[] = '• ' . $msg;
    } else {
        $lines[] = $body['error'] ?? 'Sorry — this did not go through.';
        $lines[] = 'Please go back and try again, or call ' . DESK_PHONE . '.';
    }
    $back = 'javascript:history.back()';
    $html = '';
    foreach ($lines as $l) $html .= '<p>' . htmlspecialchars($l, ENT_QUOTES, 'UTF-8') . '</p>';
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">'
       . '<title>' . ($ok ? 'Request received' : 'Please check your details') . ' — Kamini Clinic &amp; Labs</title>'
       . '<style>body{margin:0;background:#faf7f2;color:#0b1a19;font:16px/1.6 system-ui,sans-serif}'
       . 'main{max-width:520px;margin:12vh auto;padding:0 20px}h1{color:#0d4744;font-size:1.5rem}'
       . 'a{color:#0d4744;font-weight:700}</style></head><body><main>'
       . '<h1>' . ($ok ? 'Request received' : 'Please check your details') . '</h1>' . $html
       . '<p><a href="' . ($ok ? '../index.html' : $back) . '">' . ($ok ? 'Back to the website' : 'Go back to the form') . '</a></p>'
       . '</main></body></html>';
    exit;
}

/* ==========================================================
   2. CHECKING
   Each rule returns [cleaned value, error message or ''].
========================================================== */

/* one line of text: no control characters, no runs of spaces */
function one_line(string $s): string
{
    $s = preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s) ?? '';
    return trim(preg_replace('/\s+/u', ' ', $s) ?? '');
}

/* Odia, Devanagari, Bengali and full-width numerals become 0–9 */
function ascii_digits(string $s): string
{
    static $map = null;
    if ($map === null) {
        $map = [];
        foreach ([0x0966, 0x09E6, 0x0B66, 0xFF10] as $zero) {
            for ($i = 0; $i < 10; $i++) $map[mb_chr($zero + $i, 'UTF-8')] = (string) $i;
        }
    }
    return strtr($s, $map);
}

function letters(string $s): int
{
    return (int) preg_match_all('/[\p{L}\p{M}]/u', $s);
}

function rule_name(string $v): array
{
    $v = one_line($v);
    if ($v === '') return [$v, 'Please tell us your name.'];
    if (preg_match('/\d/u', $v)) return [$v, 'A name cannot contain numbers.'];
    if (!preg_match("/^[\\p{L}\\p{M} .'’-]+$/u", $v)) return [$v, 'Please use letters only in the name.'];
    if (letters($v) < 2) return [$v, 'Please enter the full name, not just an initial.'];
    if (mb_strlen($v) > 60) return [$v, 'That name is too long — 60 characters at most.'];
    if (preg_match('/(.)\1\1\1/iu', $v) || preg_match("/[.'’-]{2}/u", $v)) return [$v, 'That does not look like a name.'];
    return [$v, ''];
}

function rule_phone(string $v): array
{
    $d = preg_replace('/\D/', '', ascii_digits($v)) ?? '';
    if (strlen($d) > 10 && strpos($d, '0091') === 0) $d = substr($d, 4);
    elseif (strlen($d) > 10 && strpos($d, '91') === 0) $d = substr($d, 2);
    if (strlen($d) > 10 && $d[0] === '0') $d = substr($d, 1);

    if ($d === '') return [$d, 'Please enter a mobile number so we can call you back.'];
    if (strlen($d) !== 10) return [$d, 'A mobile number has 10 digits — this has ' . strlen($d) . '.'];
    if ($d[0] === '0') return [$d, 'Leave out the 0 at the start — just the 10-digit number.'];
    if (!preg_match('/^[6-9]/', $d)) return [$d, 'Indian mobile numbers start with 6, 7, 8 or 9.'];
    if (preg_match('/^(\d)\1{9}$/', $d)) return [$d, 'Please enter a real mobile number.'];
    return [$d, ''];
}

function rule_email(string $v): array
{
    $v = preg_replace('/\s+/u', '', $v) ?? '';
    if ($v === '') return [$v, ''];
    if (strlen($v) > 254) return [$v, 'That email address is too long.'];
    $at = strrpos($v, '@');
    if ($at === false) return [$v, 'An email address needs an @ — for example name@gmail.com.'];
    $domain = rtrim(strtolower(substr($v, $at + 1)), '.');
    if (isset(EMAIL_TYPOS[$domain])) {
        return [$v, 'Did you mean ' . substr($v, 0, $at + 1) . EMAIL_TYPOS[$domain] . '?'];
    }
    $shape = "/^[A-Za-z0-9!#$%&'*+\\/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+\\/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,24}$/";
    if ($at > 64 || !preg_match($shape, $v) || filter_var($v, FILTER_VALIDATE_EMAIL) === false) {
        return [$v, 'That email address does not look right.'];
    }
    return [$v, ''];
}

function rule_locality(string $v): array
{
    $v = one_line($v);
    if ($v === '') return [$v, 'Please tell us the area, so the right collector comes.'];
    if (preg_match('/^\d{6}$/', $v)) return [$v, ''];
    if (!preg_match("/^[\\p{L}\\p{M}0-9 ,.\\/#&()'’-]+$/u", $v)) return [$v, 'Only the locality name or PIN, please — no special characters.'];
    if (letters($v) < 2) return [$v, 'Please type the locality name, or a 6-digit PIN.'];
    if (mb_strlen($v) > 80) return [$v, 'Just the locality is enough — 80 characters at most.'];
    return [$v, ''];
}

function rule_message(string $v): array
{
    $v = str_replace(["\r\n", "\r"], "\n", $v);
    $v = preg_replace('/[\x00-\x08\x0B-\x1F\x7F]/u', '', $v) ?? '';
    $v = preg_replace('/[ \t]+/u', ' ', $v) ?? '';
    $v = trim(preg_replace("/\n{3,}/u", "\n\n", $v) ?? '');
    if (mb_strlen($v) > 500) return [$v, 'Please keep the message under 500 characters.'];
    if (preg_match('/https?:\/\/|www\.|<\s*a\s/iu', $v)) return [$v, 'Please leave out web links — describe it in words, or WhatsApp us a photo.'];
    return [$v, ''];
}

function rule_text(string $v): array
{
    $v = one_line($v);
    return mb_strlen($v) > 1000 ? [$v, 'That list is too long.'] : [$v, ''];
}

function rule_choice(string $v): array
{
    $v = one_line($v);
    return mb_strlen($v) > 100 ? [$v, 'Please choose one of the options.'] : [$v, ''];
}

/* ==========================================================
   3. LIMITS
   A small JSON file remembers who sent what, recently. Visitors are
   kept as salted hashes of their IP address, never the address itself,
   and everything older than a day is dropped on each write.
========================================================== */
function with_store(string $dir, callable $fn)
{
    $none = null;   /* the callback takes its data by reference */
    if (!is_dir($dir) && !@mkdir($dir, 0750, true)) return $fn($none);
    $fh = @fopen($dir . '/limits.json', 'c+');
    if (!$fh) return $fn($none);
    flock($fh, LOCK_EX);
    $raw = stream_get_contents($fh);
    $data = json_decode($raw ?: '[]', true);
    if (!is_array($data)) $data = [];
    $result = $fn($data);
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    fflush($fh);
    flock($fh, LOCK_UN);
    fclose($fh);
    return $result;
}

/* ==========================================================
   4. THE REQUEST
========================================================== */
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, ['ok' => false, 'error' => 'This address only accepts form submissions.']);
}

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) {
    error_log('[kamini mail] mail/config.php is missing — copy config.sample.php and fill it in.');
    respond(500, ['ok' => false, 'error' => 'The form is not set up yet.']);
}
$cfg = require $configFile;

/* Only this site's own pages may post here. A browser always says where
   a request came from; a request with no Origin is not a browser form
   on someone else's site, so it is left to the other checks. */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $o = parse_url($origin);
    $from = strtolower(($o['host'] ?? '') . (isset($o['port']) ? ':' . $o['port'] : ''));
    $allowed = array_map('strtolower', array_merge([$_SERVER['HTTP_HOST'] ?? ''], $cfg['extra_hosts'] ?? []));
    if (!in_array($from, $allowed, true)) {
        respond(403, ['ok' => false, 'error' => 'Submissions are only accepted from the clinic website.']);
    }
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > MAX_BODY) {
    respond(413, ['ok' => false, 'error' => 'That is more than the form can send.']);
}

if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false) {
    $in = json_decode((string) file_get_contents('php://input', false, null, 0, MAX_BODY + 1), true);
} else {
    $in = $_POST;
}
if (!is_array($in)) respond(400, ['ok' => false, 'error' => 'The form arrived empty.']);

/* every value must be plain text, and valid UTF-8 */
foreach ($in as $k => $v) {
    if (is_int($v) || is_float($v)) $in[$k] = $v = (string) $v;
    if (!is_string($v) || !mb_check_encoding($v, 'UTF-8')) {
        respond(400, ['ok' => false, 'error' => 'The form arrived garbled. Please try again.']);
    }
}

$kind = $in['form'] ?? '';
if (!isset(FORMS[$kind])) respond(400, ['ok' => false, 'error' => 'Unknown form.']);
$form = FORMS[$kind];

/* Bots fill in every box, including the one people cannot see, and they
   submit the instant the page loads. Both are told "thank you" — an
   error would only teach them what to change — and nothing is sent. */
$elapsed = isset($in['elapsed']) && is_numeric($in['elapsed']) ? (int) $in['elapsed'] : null;
if (trim($in['website'] ?? '') !== '' || ($elapsed !== null && $elapsed < 1500)) {
    respond(200, ['ok' => true]);
}

$clean = [];
$errors = [];
foreach ($form['fields'] as $f) {
    [$v, $e] = ('rule_' . FIELDS[$f]['rule'])((string) ($in[$f] ?? ''));
    $clean[$f] = $v;
    if ($e !== '') $errors[$f] = $e;
}
if ($errors) respond(422, ['ok' => false, 'errors' => $errors]);

/* ---------- rate limits and repeats ---------- */
$ipHeader = $cfg['ip_header'] ?? 'REMOTE_ADDR';
$ip = $_SERVER[$ipHeader] ?? ($_SERVER['REMOTE_ADDR'] ?? '');
$salt = (string) ($cfg['salt'] ?? '');
$who = hash('sha256', $salt . '|' . $ip);
$same = hash('sha256', $kind . '|' . json_encode($clean, JSON_UNESCAPED_UNICODE));
$perIp = (int) ($cfg['limits']['per_visitor'] ?? 5);
$window = (int) ($cfg['limits']['window_minutes'] ?? 15) * 60;
$perDay = (int) ($cfg['limits']['per_day'] ?? 200);
$now = time();
$today = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('Y-m-d');

$verdict = with_store($cfg['storage'] ?? __DIR__ . '/storage', function (?array &$d) use ($who, $same, $perIp, $window, $perDay, $now, $today) {
    if ($d === null) {
        error_log('[kamini mail] storage folder is not writable — rate limits are off.');
        return 'send';
    }
    $d['visitors'] = $d['visitors'] ?? [];
    $d['repeats']  = $d['repeats'] ?? [];
    $d['days']     = $d['days'] ?? [];

    foreach ($d['visitors'] as $h => $times) {
        $d['visitors'][$h] = array_values(array_filter($times, function ($t) use ($now) { return $t > $now - 86400; }));
        if (!$d['visitors'][$h]) unset($d['visitors'][$h]);
    }
    foreach ($d['repeats'] as $h => $t) if ($t < $now - 86400) unset($d['repeats'][$h]);
    foreach ($d['days'] as $day => $n) if ($day !== $today) unset($d['days'][$day]);

    /* the same details twice — a double tap, or a refresh — go once */
    if (isset($d['repeats'][$same]) && $d['repeats'][$same] > $now - 3600) return 'repeat';

    $recent = array_filter($d['visitors'][$who] ?? [], function ($t) use ($now, $window) { return $t > $now - $window; });
    if (count($recent) >= $perIp) return 'busy';
    if (($d['days'][$today] ?? 0) >= $perDay) return 'full';

    $d['visitors'][$who][] = $now;
    $d['repeats'][$same] = $now;
    $d['days'][$today] = ($d['days'][$today] ?? 0) + 1;
    return 'send';
});

if ($verdict === 'repeat') respond(200, ['ok' => true]);
if ($verdict === 'busy') {
    respond(429, ['ok' => false, 'error' => 'You have sent several requests in a few minutes — we have them all, and will call you. If it is urgent, please call ' . DESK_PHONE . '.']);
}
if ($verdict === 'full') {
    error_log('[kamini mail] daily limit of ' . $perDay . ' emails reached.');
    respond(429, ['ok' => false, 'error' => 'The online form is very busy today. Please call ' . DESK_PHONE . ' and the desk will book you in directly.']);
}

/* ==========================================================
   5. THE EMAIL
========================================================== */
$name  = $clean['name'];
$phone = $clean['phone'];
$pretty = substr($phone, 0, 5) . ' ' . substr($phone, 5);
$when = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('D j M Y, g:i A') . ' IST';

$rows = [];
foreach ($form['fields'] as $f) {
    $v = $clean[$f];
    if ($f === 'phone') $v = '+91 ' . $pretty;
    $rows[] = [FIELDS[$f]['label'], $v === '' ? '—' : $v, $f];
}

$h = function (string $s): string { return htmlspecialchars($s, ENT_QUOTES, 'UTF-8'); };

$html = '<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1a19;max-width:560px">'
      . '<h2 style="color:#0d4744;margin:0 0 4px">' . $h($form['title']) . '</h2>'
      . '<p style="margin:0 0 18px;color:#55635f;font-size:13px">From the ' . $h($form['page']) . ' form · ' . $h($when) . '</p>'
      . '<table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px">';
foreach ($rows as [$label, $value, $f]) {
    $cell = $f === 'message' ? nl2br($h($value)) : $h($value);
    if ($f === 'phone') {
        $cell = '<a href="tel:+91' . $phone . '" style="color:#0d4744;font-weight:bold">' . $h($value) . '</a>'
              . ' &nbsp;·&nbsp; <a href="https://wa.me/91' . $phone . '" style="color:#0d4744">WhatsApp</a>';
    } elseif ($f === 'email' && $value !== '—') {
        $cell = '<a href="mailto:' . $h($value) . '" style="color:#0d4744">' . $h($value) . '</a>';
    }
    $html .= '<tr><td style="border-bottom:1px solid #e6e1d8;color:#55635f;width:150px;vertical-align:top">' . $h($label) . '</td>'
           . '<td style="border-bottom:1px solid #e6e1d8;vertical-align:top">' . $cell . '</td></tr>';
}
$html .= '</table>'
       . '<p style="margin:18px 0 0;color:#55635f;font-size:12px">Sent automatically by the kaminiclinicandlabs.in website. '
       . 'Call the patient back on the number above.</p></div>';

$text = $form['title'] . "\nFrom the " . $form['page'] . ' form · ' . $when . "\n\n";
foreach ($rows as [$label, $value]) $text .= str_pad($label . ':', 20) . str_replace("\n", "\n" . str_repeat(' ', 20), $value) . "\n";

$mail = new PHPMailer(true);
try {
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($cfg['from']['email'], $cfg['from']['name'] ?? 'Kamini Clinic website');
    foreach ((array) $cfg['to'] as $addr) $mail->addAddress($addr);
    if (!empty($clean['email'])) $mail->addReplyTo($clean['email'], $name);
    $mail->Subject = $form['title'] . ' — ' . $name . ' (' . $pretty . ')';
    $mail->isHTML(true);
    $mail->Body = $html;
    $mail->AltBody = $text;

    if (($cfg['transport'] ?? 'smtp') === 'file') {
        /* local testing: write the message to storage/outbox instead of sending it */
        $mail->preSend();
        $dir = ($cfg['storage'] ?? __DIR__ . '/storage') . '/outbox';
        if (!is_dir($dir)) mkdir($dir, 0750, true);
        file_put_contents($dir . '/' . date('Ymd-His') . '-' . $kind . '-' . substr($same, 0, 8) . '.eml', $mail->getSentMIMEMessage());
    } else {
        $s = $cfg['smtp'];
        $mail->isSMTP();
        $mail->Host = $s['host'];
        $mail->Port = (int) $s['port'];
        $mail->SMTPAuth = ($s['username'] ?? '') !== '';
        $mail->Username = $s['username'] ?? '';
        $mail->Password = $s['password'] ?? '';
        $secure = $s['secure'] ?? 'ssl';
        $mail->SMTPSecure = $secure === 'ssl' ? PHPMailer::ENCRYPTION_SMTPS : ($secure === 'tls' ? PHPMailer::ENCRYPTION_STARTTLS : '');
        $mail->SMTPAutoTLS = $secure !== '';
        $mail->Timeout = 15;
        $mail->send();
    }
} catch (MailException $ex) {
    /* the details go to the server log, never to the visitor */
    error_log('[kamini mail] sending failed: ' . $mail->ErrorInfo);
    with_store($cfg['storage'] ?? __DIR__ . '/storage', function (?array &$d) use ($same) {
        if ($d !== null) unset($d['repeats'][$same]);   /* so a retry is not swallowed as a repeat */
    });
    respond(502, ['ok' => false, 'error' => 'Sorry — this did not go through.']);
}

respond(200, ['ok' => true]);
