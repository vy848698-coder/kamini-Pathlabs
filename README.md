# Kamini Clinic &amp; Labs — Website

Static marketing + booking site for **Kamini Clinic & Labs**, a diagnostic centre in
Jagamara, Khandagiri, Bhubaneswar. No build step, no framework — plain HTML, CSS and
vanilla JavaScript. The one server-side piece is `mail/send.php`, which emails form
submissions to the clinic, so the host needs PHP 7.4 or newer.

## File layout

```
kamini-Pathlabs/
├── index.html                  Home page (hero, programmes, tests, packages, FAQ, booking)
├── about.html                  About Us (story, timeline, values, quality, visit)
├── homecollection.html         Home sample collection (slot picker, test picker, coverage)
├── doctors.html                Our Doctors (panel, weekly OPD board, visit, on-site tests)
├── contact.html                Contact (live desk status, switchboard, enquiry form, map)
├── privacy.html                Privacy Policy
├── terms.html                  Terms of Service
├── 404.html                    Not-found page
├── favicon.svg                 Brand mark used as the tab icon
├── site.webmanifest            PWA / add-to-home-screen metadata
├── robots.txt                  Crawler rules
├── sitemap.xml                 URL list for search engines
├── assets/
│   ├── css/
│   │   ├── style.css           All shared styling — extracted from index.html
│   │   ├── pages.css           Extra styling for the legal pages, 404 and about
│   │   ├── about.css           Everything unique to about.html (all .ab- prefixed)
│   │   ├── homecollection.css  Everything unique to homecollection.html (.hc- prefixed)
│   │   ├── doctors.css         Everything unique to doctors.html (.dr- prefixed)
│   │   └── contact.css         Everything unique to contact.html (.ct- prefixed)
│   └── js/
│       ├── image-fallback.js   Inline-SVG placeholders when a photo fails to load
│       ├── forms.js            Checks and sends every form (see "Forms and email")
│       ├── main.js             All shared page behaviour (see below)
│       ├── homecollection.js   Slot picker, test picker and coverage checker
│       ├── doctors.js          Today's board, week dials, filters and booking prefill
│       └── contact.js          Desk status, week strip, enquiry thank-you, copy address
├── mail/
│   ├── send.php                Receives every form, checks it again, emails the clinic
│   ├── config.sample.php       Template for config.php (SMTP login, recipients, limits)
│   ├── config.php              The real settings — NOT in git, created on the server
│   ├── .htaccess               Blocks web access to everything here except send.php
│   ├── lib/PHPMailer/          PHPMailer 7.1.1 (Exception, PHPMailer, SMTP + LICENSE)
│   └── storage/                Rate-limit file (and test mail) — NOT in git, made by PHP
└── Images/                     Local photography goes here
```

## How the pages are wired

Every page loads the same core assets, in this order:

| Asset | Where | Why the order matters |
| --- | --- | --- |
| `assets/css/style.css` | `<head>` | Design tokens + all component styles |
| `assets/css/pages.css` | `<head>`, inner pages only | Overrides layered on top of `style.css` |
| `assets/css/about.css` | `<head>`, `about.html` only | Loaded last; every rule is prefixed `.ab-` |
| `assets/css/homecollection.css` | `<head>`, `homecollection.html` only | Loaded last; every rule is prefixed `.hc-` |
| `assets/css/doctors.css` | `<head>`, `doctors.html` only | Loaded last; every rule is prefixed `.dr-` |
| `assets/js/image-fallback.js` | `<head>`, **blocking** | Defines `kFall()` before any `<img onerror>` can fire |
| `assets/js/forms.js` | end of `<body>`, `defer`, pages with a form only | Before `main.js` and the page script, so `contact.js` can use `KForms` |
| `assets/js/main.js` | end of `<body>`, `defer` | Runs after the DOM is parsed |
| `assets/js/doctors.js` | after `main.js`, `defer` | Page-specific; `main.js` already owns the nav, reveals, rail and form |

`image-fallback.js` must stay a plain blocking script in the head. If it is deferred, a
photo that fails early would call `kFall` before it exists and the layout would break.

## What `main.js` does

All of it is inside one IIFE and every feature is guarded, so the same file is safe to
load on pages that do not have the element in question.

- Rotating hero word (`#rot`)
- Promo carousel with dots, arrows, autoplay, hover-pause and touch swipe (`#pcar`)
- Scroll reveal for `.rv` elements via `IntersectionObserver`
- Animated counters for any element with `data-n`
- Sticky nav state, top scroll-progress bar, hero parallax
- Mobile burger menu (`#burger` / `#nlinks`)
- FAQ accordion (`.fq`)
- Chapter rail spy + sideways auto-scroll (`#chap`) — used by `about.html` and `doctors.html`
- Advisor widget dismiss (`#advClose`)
- Smooth scrolling for in-page anchors, offset for the sticky header

Everything checks `prefers-reduced-motion` and falls back to static output when the
visitor has asked for reduced motion.

### Elements `main.js` expects on every page

`#nav`, `#prog`, `#burger`, `#nlinks` — these live in the shared header/footer markup,
so keep them when you add a new page.

Anchor jumps clear the sticky chrome via `stickyTop()`: 72px for the header, plus the
height of `#chap` on any page that has a chapter rail. A new page with its own sticky
sub-nav only has to give it `id="chap"` to get the same offset and the same scrollspy.

## The doctors page

`doctors.html` holds the consultant panel, the weekly OPD board, the visit walk-through,
the on-site investigation list, the referral panel and its own FAQ.

**One source of truth for timings.** Every clinic is declared once, on the roster card, as
`data-sessions` — a small JSON array of `{d, s, e, t}` where `d` is the weekdays
(0 = Sunday), `s` and `e` are minutes from midnight, and `t` is the label a patient reads.
`doctors.js` reads those back to build the "In clinic today" board in the masthead, ring
today's letter on each week dial and drive the "Sitting today" filter, so the board can
never disagree with the cards.

The weekly board itself is written out in the markup rather than generated, so it is there
for search engines and for a visitor with JavaScript off. **If a consultant's day or time
changes, edit it in two places: the card's `data-sessions` (plus its `.dr-days` letters and
`.dr-when` text) and the matching slips in the `#board` columns.** Keep the JSON-LD
`openingHoursSpecification` block at the foot of the page in step as well.

## Forms and email

Four forms reach the desk, and all of them post to `mail/send.php`:

| Form | Page | `data-form` | Fields |
| --- | --- | --- | --- |
| `#bform` "Request a callback" | `index.html` | `home` | name, phone, time, service |
| `#bform` "Request a consultation" | `doctors.html` | `doctors` | name, phone, day, doctor |
| `#bform` "Book a home visit" | `homecollection.html` | `collection` | name, phone, locality, day, slot, tests |
| `#ctForm` "Tell us what you need" | `contact.html` | `contact` | name, phone, email, topic, when, message |

**The checks run twice, with the same rules** — in the browser (`assets/js/forms.js`) so
the visitor is told straight away, and again in `mail/send.php` because anyone can post to
it directly. A field's rule comes from its `name`; `required` decides whether it can be blank.
If you change a rule, change it in both files.

| Field | Accepted |
| --- | --- |
| name | 2–60 characters, letters in any script (Odia and Hindi included), spaces, `. ' -`. No digits or symbols. |
| phone | Exactly 10 digits starting 6–9. Typing stops at 10; a pasted `+91…`, `0091…` or `0…` number is trimmed to 10; Odia/Hindi numerals are converted. All-same-digit numbers are refused. |
| email | Optional. Proper `name@domain.tld` shape, at most 254 characters. Common slips (`gmial.com`, `gmail.con`…) are refused with a one-tap "Did you mean…?" |
| locality | 2–80 characters, letters/digits and `, . / # & ( ) ' -`, or a 6-digit PIN. |
| message | Optional, at most 500 characters, no web links. |
| selects | Sent as chosen; the server only caps the length, so renaming an option never breaks the form. |

`send.php` also: accepts posts only from the site's own pages; ignores bots (a hidden
`website` field that people never fill, and anything submitted within 1.5 s of the page
loading — both get a fake "thank you"); sends the same details only once an hour (double
taps and refreshes); limits each visitor to 5 sends in 15 minutes and the whole site to
200 a day; and keeps only salted hashes of IP addresses. If sending fails, the visitor's
details stay in the form with the phone and WhatsApp numbers offered instead, and the
reason is written to the PHP error log. With JavaScript off, the forms still post to
`send.php` and get a plain thank-you (or what-to-fix) page back.

**Adding a form field:** give the input a `name`, then add that name to the form's list
in `FORMS` at the top of `mail/send.php` (and to `FIELDS` with a label and rule). A field
the server does not list is dropped.

### Setting up email on the server

1. Upload the whole site, `mail/` included.
2. On `kaminiclinicandlabs@gmail.com`, turn on 2-Step Verification, then create an
   App Password at <https://myaccount.google.com/apppasswords>. The normal Gmail password
   will not work.
3. Copy `mail/config.sample.php` to `mail/config.php` **on the server** and fill in the App
   Password, the recipient address(es) and a random `salt`. Never commit this file.
4. Make sure PHP can write to `mail/storage/` (it creates the folder itself if it can).
5. Send one test from each form and check the inbox (and the spam folder, the first time).

The `.htaccess` in `mail/` keeps `config.php` and the storage folder private on Apache
and LiteSpeed hosts (Hostinger, most cPanel plans). On an nginx host, block `/mail/`
except `send.php` in the server config instead.

To try the forms on a laptop without sending anything, set `'transport' => 'file'` in
`config.php`: each email is written to `mail/storage/outbox/` as an `.eml` file.

## Images

Photos currently come from Unsplash URLs. Each `<img>` carries an
`onerror="kFall(this,'key')"` fallback that swaps in an inline SVG illustration, so a
blocked or slow photo never breaks the layout. To use your own photography, drop files
into `Images/` and point the `src` at them — keep the `onerror` attribute.

## Running it locally

Serve the folder with PHP so the forms can reach `mail/send.php` (with XAMPP on Windows
the binary is `C:/xampp/php/php.exe`):

```bash
php -S localhost:8000
```

Then open <http://localhost:8000>. Any static server (`npx serve .`,
`python -m http.server`) shows the pages, but the forms will report that sending failed.

## Deploying

Upload the whole folder as-is. Then:

1. Replace `https://kaminiclinicandlabs.in/` in the `<link rel="canonical">` tags,
   `robots.txt` and `sitemap.xml` with the real domain.
2. Configure the host to serve `404.html` for unknown paths.
3. Set up email — see "Setting up email on the server" above.
4. Update the "Last updated" dates in `privacy.html` and `terms.html`, and have the two
   legal pages reviewed before going live — they are a solid starting draft, not legal advice.
