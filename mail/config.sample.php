<?php
/* ==========================================================
   Settings for mail/send.php
   Copy this file to mail/config.php on the server and fill it in.
   config.php holds a password, so it is in .gitignore — never
   commit it, and never paste it anywhere public.
========================================================== */
return [

    /* 'smtp' sends for real. 'file' writes each email to
       storage/outbox/ instead — for trying the forms on a laptop
       without sending anything. */
    'transport' => 'smtp',

    /* The mailbox the website logs in to, to send.
       For Gmail: turn on 2-Step Verification for the account, then make
       an App Password at https://myaccount.google.com/apppasswords and
       paste the 16 letters below. The normal Gmail password will NOT work. */
    'smtp' => [
        'host'     => 'smtp.gmail.com',
        'port'     => 465,
        'secure'   => 'ssl',            /* 'ssl' for port 465, 'tls' for port 587 */
        'username' => 'kaminiclinicandlabs@gmail.com',
        'password' => 'xxxx xxxx xxxx xxxx',
    ],

    /* Who the email says it is from. With Gmail this must be the same
       address as smtp.username above. */
    'from' => [
        'email' => 'kaminiclinicandlabs@gmail.com',
        'name'  => 'Kamini Clinic website',
    ],

    /* Who receives the form details. More than one address is fine. */
    'to' => [
        'kaminiclinicandlabs@gmail.com',
    ],

    /* When a visitor gives an email address (the contact form asks for
       one), send them a short "we have your message" note with the
       clinic's numbers and hours. At most one a day per address. */
    'auto_reply' => true,

    /* Any long random text. It scrambles visitors' IP addresses before
       they are written to the rate-limit file. */
    'salt' => 'change-me-to-something-long-and-random',

    /* Spam and accident protection. */
    'limits' => [
        'per_visitor'    => 5,     /* submissions one visitor may make… */
        'window_minutes' => 15,    /* …in this many minutes */
        'per_day'        => 200,   /* all forms together; Gmail allows about 500 a day */
    ],

    /* Behind Cloudflare, every visitor seems to come from Cloudflare's
       address. Set this to 'HTTP_CF_CONNECTING_IP' in that case. */
    'ip_header' => 'REMOTE_ADDR',

    /* Extra hosts allowed to post to the form, besides the one serving it,
       e.g. 'www.kaminiclinicandlabs.in' if both www and bare domain are live. */
    'extra_hosts' => [],

    /* Where the rate-limit file (and the 'file' transport's outbox) live.
       Must be writable by PHP. */
    'storage' => __DIR__ . '/storage',
];
