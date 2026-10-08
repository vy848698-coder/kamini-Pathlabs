<?php
/* ==========================================================
   KAMINI CLINIC & LABS — mail/templates.php
   How the two emails look. send.php decides what goes in them;
   this file only lays it out.

     clinic_email()   the enquiry, as the front desk receives it
     patient_email()  the "we have your message" confirmation

   Email is not the web: Gmail drops SVG, most <style>, flexbox,
   grid and web fonts, and Outlook drops more. So the layout is
   tables, every style is inline, colours are solid, and the logo
   is a PNG sent inside the email (cid:logo) rather than linked,
   so it shows before the site has a live domain. The one <style>
   block only narrows the padding on phones, where it is honoured.

   Brand colours match assets/css/style.css.
========================================================== */
declare(strict_types=1);

const C_TEAL = '#0d4744';
const C_TEAL_900 = '#072220';
const C_TEAL_50 = '#eef5f2';
const C_GOLD = '#c9a24b';
const C_GOLD_2 = '#ab8639';
const C_GOLD_PALE = '#f5ecd6';
const C_INK = '#0b1a19';
const C_GREY = '#55635f';
const C_GREY_2 = '#8a9591';
const C_LINE = '#e4dfd2';
const C_LINE_2 = '#efebe0';
const C_IVORY = '#fbf9f4';
const C_IVORY_2 = '#f4f0e6';

const F_SANS = "'Manrope','Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const F_SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

const MAPS_URL = 'https://www.google.com/maps/dir/?api=1&destination=Kamini%20Clinic%20%26%20Labs%2C%20Plot%20No.%20555%2C%20Alekh%20Niwas%2C%20Jagamara%2C%20Khandagiri%2C%20Bhubaneswar%20751030';

function esc(string $s): string
{
    return htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
}

/* ---------- pieces ---------- */

/* A button that survives Outlook: the colour sits on the cell, the
   padding on the link, so the whole shape is clickable everywhere. */
function email_button(string $href, string $label, string $bg, string $fg, bool $newTab = false, bool $center = false): string
{
    $target = $newTab ? ' target="_blank" rel="noopener"' : '';
    return '<table role="presentation"' . ($center ? ' align="center"' : '') . ' cellspacing="0" cellpadding="0" border="0"><tr>'
         . '<td bgcolor="' . $bg . '" style="border-radius:8px;background:' . $bg . '">'
         . '<a href="' . esc($href) . '"' . $target . ' style="display:inline-block;padding:14px 22px;font-family:' . F_SANS . ';'
         . 'font-size:15px;font-weight:700;line-height:1;color:' . $fg . ';text-decoration:none;border-radius:8px;white-space:nowrap">'
         . $label . '</a></td></tr></table>';
}

/* Two buttons side by side; on a phone they stack (centred, when the
   buttons themselves were made with $center). */
function email_buttons(string $first, string $second, bool $center = false): string
{
    $al = $center ? ' align="center"' : '';
    return '<table role="presentation"' . $al . ' cellspacing="0" cellpadding="0" border="0"><tr>'
         . '<td class="stack"' . $al . ' style="padding:0 10px 10px 0;vertical-align:top">' . $first . '</td>'
         . '<td class="stack"' . $al . ' style="padding:0 0 10px 0;vertical-align:top">' . $second . '</td>'
         . '</tr></table>';
}

function email_label(string $text, string $color = C_GREY_2): string
{
    return '<div style="font-family:' . F_SANS . ';font-size:11px;font-weight:800;letter-spacing:1.6px;'
         . 'text-transform:uppercase;color:' . $color . ';margin:0 0 8px">' . esc($text) . '</div>';
}

/* The frame both emails share: ivory page, white card, teal header
   with the logo, a gold rule, the body, and a dark footer. */
function email_shell(string $preheader, string $headerNote, string $body, string $footer, bool $logo): string
{
    $brand = $logo
        ? '<img src="cid:logo" width="168" height="64" alt="Kamini Clinic &amp; Labs" style="display:block;border:0;outline:none;width:168px;height:64px">'
        : '<span style="font-family:' . F_SERIF . ';font-size:28px;color:#ffffff">Kamini</span>'
          . '<br><span style="font-family:' . F_SANS . ';font-size:10px;font-weight:800;letter-spacing:3px;color:' . C_GOLD . '">CLINIC &amp; LABS</span>';

    $note = $headerNote === '' ? '' :
        '<td align="right" style="vertical-align:middle;font-family:' . F_SANS . ';font-size:11px;font-weight:800;'
        . 'letter-spacing:1.6px;text-transform:uppercase;color:' . C_GOLD . '">' . $headerNote . '</td>';

    return '<!doctype html><html lang="en"><head>'
         . '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
         . '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">'
         . '<title>Kamini Clinic &amp; Labs</title>'
         . '<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">'
         . '<style>@media (max-width:620px){.wrap{width:100%!important}.px{padding-left:20px!important;padding-right:20px!important}'
         . '.stack{display:block!important;width:100%!important;padding-right:0!important;padding-left:0!important}.hide-sm{display:none!important}}</style>'
         . '</head><body style="margin:0;padding:0;background:' . C_IVORY_2 . '">'
         /* the line the inbox shows next to the subject; padded so no body text leaks in after it */
         . '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">' . esc($preheader)
         . str_repeat('&#847;&zwnj;&nbsp;', 40) . '</div>'
         . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="' . C_IVORY_2 . '" style="background:' . C_IVORY_2 . '">'
         . '<tr><td align="center" style="padding:28px 12px">'
         . '<table role="presentation" class="wrap" width="600" cellspacing="0" cellpadding="0" border="0" '
         . 'style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid ' . C_LINE . '">'
         /* header */
         . '<tr><td class="px" bgcolor="' . C_TEAL . '" style="background:' . C_TEAL . ';padding:22px 32px">'
         . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>'
         . '<td style="vertical-align:middle">' . $brand . '</td>' . $note . '</tr></table></td></tr>'
         . '<tr><td height="4" bgcolor="' . C_GOLD . '" style="background:' . C_GOLD . ';font-size:0;line-height:0">&nbsp;</td></tr>'
         /* body */
         . '<tr><td class="px" style="padding:32px 32px 30px;font-family:' . F_SANS . ';color:' . C_INK . '">' . $body . '</td></tr>'
         /* footer */
         . '<tr><td class="px" bgcolor="' . C_TEAL_900 . '" style="background:' . C_TEAL_900 . ';padding:22px 32px;'
         . 'font-family:' . F_SANS . ';font-size:12px;line-height:1.6;color:#a9bdb8">' . $footer . '</td></tr>'
         . '</table></td></tr></table></body></html>';
}

/* "Complete Blood Count, Lipid Profile — ₹900" as tags and a total */
function email_tests(string $value): string
{
    if (!preg_match('/^(.+?) — (₹[\d,]+)$/u', $value, $m)) return esc($value);
    $chips = '';
    foreach (explode(', ', $m[1]) as $t) {
        $chips .= '<span style="display:inline-block;margin:0 6px 6px 0;padding:5px 10px;border-radius:999px;'
                . 'background:' . C_TEAL_50 . ';color:' . C_TEAL . ';font-size:13px;font-weight:700">' . esc($t) . '</span>';
    }
    return $chips . '<div style="margin-top:4px;font-size:14px;color:' . C_GREY . '">Total quoted '
         . '<b style="color:' . C_GOLD_2 . ';font-size:16px">' . esc($m[2]) . '</b></div>';
}

/* ==========================================================
   THE CLINIC'S COPY
   $d: title, page, when, name, phone (10 digits), pretty ("98614 51521"),
       email, message, rows (list of [label, value, field]).
   Returns [html, text].
========================================================== */
function clinic_email(array $d, bool $logo): array
{
    $tel = 'tel:+91' . $d['phone'];
    $wa = 'https://wa.me/91' . $d['phone'];
    $first = explode(' ', $d['name'])[0];

    $body = '<span style="display:inline-block;padding:6px 12px;border-radius:999px;background:' . C_GOLD_PALE . ';'
          . 'color:' . C_GOLD_2 . ';font-size:11px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase">'
          . esc($d['title']) . '</span>'
          . '<h1 style="margin:14px 0 6px;font-family:' . F_SERIF . ';font-size:34px;line-height:1.15;font-weight:400;color:' . C_TEAL . '">'
          . esc($d['name']) . '</h1>'
          . '<p style="margin:0 0 24px;font-size:13px;color:' . C_GREY_2 . '">' . esc($d['page']) . ' form &nbsp;·&nbsp; ' . esc($d['when']) . '</p>'
          . email_buttons(
                email_button($tel, '&#9742;&nbsp; Call +91 ' . esc($d['pretty']), C_GOLD, C_INK),
                email_button($wa, 'WhatsApp ' . esc($first), C_TEAL, '#ffffff', true)
            );

    /* the details, as a ruled card */
    $body .= '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" '
           . 'style="margin-top:18px;border:1px solid ' . C_LINE . ';border-radius:12px;border-collapse:separate;overflow:hidden">';
    $i = 0;
    foreach ($d['rows'] as [$label, $value, $field]) {
        if ($field === 'name' || $field === 'message') continue;
        if ($field === 'phone') {
            $cell = '<a href="' . $tel . '" style="color:' . C_TEAL . ';font-weight:800;text-decoration:none">' . esc($value) . '</a>';
        } elseif ($field === 'email' && $value !== '—') {
            $cell = '<a href="mailto:' . esc($value) . '" style="color:' . C_TEAL . ';font-weight:700">' . esc($value) . '</a>';
        } elseif ($field === 'tests' && $value !== '—') {
            $cell = email_tests($value);
        } else {
            $cell = esc($value);
        }
        $rule = $i++ ? 'border-top:1px solid ' . C_LINE_2 . ';' : '';
        $body .= '<tr>'
               . '<td style="' . $rule . 'padding:13px 16px;width:36%;vertical-align:top;background:' . C_IVORY . ';'
               . 'font-size:11px;font-weight:800;letter-spacing:1.2px;text-transform:uppercase;color:' . C_GREY_2 . '">' . esc($label) . '</td>'
               . '<td style="' . $rule . 'padding:12px 16px;vertical-align:top;font-size:15px;line-height:1.5;color:' . C_INK . '">' . $cell . '</td>'
               . '</tr>';
    }
    $body .= '</table>';

    if (($d['message'] ?? '') !== '') {
        $body .= '<div style="margin-top:22px">' . email_label('Their message')
               . '<div style="padding:16px 18px;background:' . C_IVORY . ';border-left:3px solid ' . C_GOLD . ';border-radius:0 8px 8px 0;'
               . 'font-size:15px;line-height:1.65;color:' . C_INK . '">' . nl2br(esc($d['message'])) . '</div></div>';
    }

    $body .= '<p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:' . C_GREY . '">'
           . 'The website told them to expect a call within 15 minutes during working hours.'
           . ($d['email'] !== '' ? ' Press <b>Reply</b> to answer ' . esc($first) . ' by email.' : '')
           . '</p>';

    $footer = 'Sent automatically by the enquiry form on the Kamini Clinic &amp; Labs website.';

    $preheader = '+91 ' . $d['pretty'];
    foreach ($d['rows'] as [, $value, $field]) {
        if (!in_array($field, ['name', 'phone', 'email', 'message'], true) && $value !== '—') { $preheader .= ' · ' . $value; break; }
    }

    $html = email_shell($preheader, 'New enquiry', $body, $footer, $logo);

    $text = strtoupper($d['title']) . "\n" . $d['name'] . "\n" . $d['page'] . ' form · ' . $d['when'] . "\n\n";
    foreach ($d['rows'] as [$label, $value]) {
        $text .= str_pad($label . ':', 20) . str_replace("\n", "\n" . str_repeat(' ', 20), $value) . "\n";
    }
    $text .= "\nCall:     +91 " . $d['pretty'] . "\nWhatsApp: " . $wa . "\n";

    return [$html, $text];
}

/* ==========================================================
   THE PATIENT'S CONFIRMATION
   Built only from fixed text, the name and the checked phone number —
   see the note in send.php for why nothing else may go in here.
   Returns [html, text].
========================================================== */
function patient_email(string $name, string $pretty, bool $logo): array
{
    $a = 'style="color:' . C_TEAL . ';font-weight:800;text-decoration:none"';

    $body = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">'
          . '<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>'
          . '<td width="56" height="56" align="center" bgcolor="' . C_TEAL_50 . '" style="width:56px;height:56px;border-radius:50%;'
          . 'background:' . C_TEAL_50 . ';font-family:Arial,sans-serif;font-size:28px;font-weight:700;color:' . C_TEAL . ';line-height:56px">&#10003;</td>'
          . '</tr></table>'
          . '<h1 style="margin:18px 0 8px;font-family:' . F_SERIF . ';font-size:36px;line-height:1.1;font-weight:400;color:' . C_TEAL . '">We have your message</h1>'
          . '<p style="margin:0;font-size:16px;line-height:1.6;color:' . C_GREY . '">Thank you, ' . esc($name) . '.<br>'
          . 'Your note has reached our front desk at Kamini Clinic &amp; Labs.</p>'
          . '</td></tr></table>';

    /* the promise, made concrete */
    $body .= '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:26px">'
           . '<tr><td align="center" bgcolor="' . C_TEAL_50 . '" style="background:' . C_TEAL_50 . ';border-radius:14px;padding:24px 20px">'
           . email_label('We will call you on', C_TEAL)
           . '<div style="font-family:' . F_SERIF . ';font-size:32px;line-height:1.1;color:' . C_TEAL . '">+91 ' . esc($pretty) . '</div>'
           . '<div style="margin-top:8px;font-size:14px;color:' . C_GREY . '">usually within 15 minutes during working hours</div>'
           . '</td></tr></table>';

    $body .= '<p style="margin:26px 0 14px;font-size:15px;line-height:1.6;color:' . C_INK . ';text-align:center">'
           . '<b>Number wrong, or is it urgent?</b> Reach us straight away:</p>'
           . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td align="center">'
           . email_buttons(
                 email_button('tel:+919861451521', '&#9742;&nbsp; Call +91 98614 51521', C_GOLD, C_INK, false, true),
                 email_button('https://wa.me/919861451521', 'WhatsApp us', C_TEAL, '#ffffff', true, true),
                 true
             )
           . '</td></tr></table>';

    /* numbers and hours, side by side; stacked on a phone */
    $cell = 'padding:18px 18px 16px;background:' . C_IVORY . ';border:1px solid ' . C_LINE_2 . ';border-radius:12px;vertical-align:top;font-size:14px;line-height:1.7;color:' . C_INK;
    $body .= '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:16px"><tr>'
           . '<td class="stack" width="50%" style="padding:0 6px 12px 0;vertical-align:top">'
           . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="' . $cell . '">'
           . email_label('Other numbers')
           . '<span style="color:' . C_GREY . '">Alternate</span><br><a href="tel:+919040267654" ' . $a . '>+91 90402 67654</a><br>'
           . '<span style="color:' . C_GREY . '">Clinic landline</span><br><a href="tel:+916747960142" ' . $a . '>+91 674 7960142</a>'
           . '</td></tr></table></td>'
           . '<td class="stack" width="50%" style="padding:0 0 12px 6px;vertical-align:top">'
           . '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="' . $cell . '">'
           . email_label('Opening hours')
           . '<span style="color:' . C_GREY . '">Mon – Sat</span><br><b>7:00 AM – 9:00 PM</b><br>'
           . '<span style="color:' . C_GREY . '">Sunday</span><br><b>7:00 AM – 1:00 PM</b>'
           . '</td></tr></table></td>'
           . '</tr></table>';

    $body .= '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="' . $cell . '">'
           . email_label('Visit us')
           . 'Plot No. 555, Alekh Niwas, In front of ICICI Bank,<br>Jagamara, Khandagiri, Bhubaneswar – 751030<br>'
           . '<a href="' . MAPS_URL . '" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:' . C_TEAL . ';font-weight:800">Get directions &rarr;</a>'
           . '</td></tr></table>';

    $body .= '<p style="margin:26px 0 0;font-size:15px;line-height:1.6;color:' . C_INK . '">Warm regards,<br>'
           . '<span style="font-family:' . F_SERIF . ';font-size:20px;color:' . C_TEAL . '">The front desk, Kamini Clinic &amp; Labs</span></p>';

    $footer = '<b style="color:#ffffff">Kamini Clinic &amp; Labs</b> &nbsp;·&nbsp; Jagamara, Khandagiri, Bhubaneswar<br>'
            . '<span style="color:#7f9792">You are receiving this because this email address was entered on the contact form on our website. '
            . 'If that was not you, please ignore this message — we will not email you again.</span>';

    $html = email_shell('We will call you back on +91 ' . $pretty . ' — usually within 15 minutes.', '', $body, $footer, $logo);

    $text = "Dear " . $name . ",\n\n"
          . "Thank you for contacting Kamini Clinic & Labs. Your note has reached our front desk, and we will "
          . "call you back on +91 " . $pretty . " — usually within 15 minutes during working hours.\n\n"
          . "If that number is wrong, or it is urgent, call or WhatsApp us on +91 98614 51521.\n\n"
          . "Alternate:        +91 90402 67654\n"
          . "Clinic landline:  +91 674 7960142\n"
          . "Hours:            Mon – Sat 7:00 AM – 9:00 PM, Sunday 7:00 AM – 1:00 PM\n"
          . "Address:          Plot No. 555, Alekh Niwas, In front of ICICI Bank,\n"
          . "                  Jagamara, Khandagiri, Bhubaneswar – 751030\n"
          . "Directions:       " . MAPS_URL . "\n\n"
          . "Warm regards,\nThe front desk, Kamini Clinic & Labs\n\n"
          . "--\nYou are receiving this because this email address was entered on the contact form on our website. "
          . "If that was not you, please ignore this message — we will not email you again.\n";

    return [$html, $text];
}
