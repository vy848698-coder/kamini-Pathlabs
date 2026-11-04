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

    /* The mailbox the website logs in to, to send: a BigRock (cPanel)
       mailbox, with the same password you use for its webmail. Server
       details are under cPanel → Email Accounts → Connect Devices. */
    'smtp' => [
        'host'     => 'mail.kaminilabs.in',
        'port'     => 465,
        'secure'   => 'ssl',            /* 'ssl' for port 465, 'tls' for port 587 */
        'username' => 'hello@kaminilabs.in',
        'password' => 'the mailbox password',
    ],

    /* Who the email says it is from. Must be the same mailbox as
       smtp.username above, or BigRock may refuse or junk it. */
    'from' => [
        'email' => 'hello@kaminilabs.in',
        'name'  => 'Kamini Clinic website',
    ],

    /* Who receives the form details. More than one address is fine. */
    'to' => [
        'info@kaminilabs.in',
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
        'per_day'        => 200,   /* all forms together; BigRock also caps outgoing mail per hour */
    ],

    /* Behind Cloudflare, every visitor seems to come from Cloudflare's
       address. Set this to 'HTTP_CF_CONNECTING_IP' in that case. */
    'ip_header' => 'REMOTE_ADDR',

    /* Extra hosts allowed to post to the form, besides the one serving it,
       e.g. both the www and bare domain, which are both live. */
    'extra_hosts' => ['kaminilabs.in', 'www.kaminilabs.in'],

    /* Where the rate-limit file (and the 'file' transport's outbox) live.
       Must be writable by PHP. */
    'storage' => __DIR__ . '/storage',
];
