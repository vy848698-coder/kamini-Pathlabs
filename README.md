# Kamini Clinic &amp; Labs — Website

Static marketing + booking site for **Kamini Clinic & Labs**, a diagnostic centre in
Jagamara, Khandagiri, Bhubaneswar. No build step, no framework — plain HTML, CSS and
vanilla JavaScript, so it can be dropped onto any static host.

## File layout

```
kamini-Pathlabs/
├── index.html                  Home page (hero, programmes, tests, packages, FAQ, booking)
├── about.html                  About Us (story, timeline, values, quality, visit)
├── homecollection.html         Home sample collection (slot picker, test picker, coverage)
├── doctors.html                Our Doctors (panel, weekly OPD board, visit, on-site tests)
├── test-package.html           Tests & Packages (rate card, packages matrix, machines)
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
│   │   └── tests.css           Everything unique to test-package.html (.tp- prefixed)
│   └── js/
│       ├── image-fallback.js   Inline-SVG placeholders when a photo fails to load
│       ├── main.js             All shared page behaviour (see below)
│       ├── homecollection.js   Slot picker, test picker and coverage checker
│       ├── tests.js            Rate-card search, filters, packages chooser, chain
│       └── doctors.js          Today's board, week dials, filters and booking prefill
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
| `assets/css/tests.css` | `<head>`, `test-package.html` only | Loaded last; every rule is prefixed `.tp-` |
| `assets/js/image-fallback.js` | `<head>`, **blocking** | Defines `kFall()` before any `<img onerror>` can fire |
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
- Booking form validation (`#bform`) — **front-end only, see below**
- Chapter rail spy + sideways auto-scroll (`#chap`) — used by `about.html`, `doctors.html`
  and `test-package.html`
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

## The tests & packages page

`test-package.html` is the rate card: the search, the body-system index, the ruled ledger
of investigations, the three checkups as one comparison matrix, the machines that run on
site, the laboratory network and a pricing FAQ.

The twelve tiles in section 01 are photographs from `Images/healthcare/`, one per
health concern — a patient recognises a kidney long before they recognise "KFT". Eleven
filter the rate card; the twelfth is brass and links to the packages instead. Each
`<img>` keeps the project's `onerror="kFall(this,'key')"` fallback.

**One source of truth for every test.** A test is declared exactly once — as a `.tp-row`
in the ledger — carrying `data-name`, `data-alias` (search synonyms), `data-sys` (one or
more body systems) and its price, in the markup. `tests.js` reads those rows back to build
the search index and the suggestion sheet, the counts on the body-system tiles, the
per-department counts and the "showing n of n" line. **To add or reprice a test, edit its
row and nothing else** — every count and every search result follows.

Prices are printed only where we have one. Everything else shows *quoted on call*, which
is a designed state rather than a placeholder: `.tp-rprice` holds either
`<b>₹300</b><s>₹400</s>` or `<em class="tp-ask">Quoted on call</em>`. Swap an `em.tp-ask`
for the `b`/`s` pair when a rate is confirmed. The priced lines are also listed in the
page's `OfferCatalog` JSON-LD at the foot of the file — keep the two in step.

The packages matrix raises one column through a single class on `#tpMtx`
(`p1` / `p2` / `p3`). The chooser sets it, and `p2` is written into the markup so the
most-booked column is already raised with JavaScript off.

Every nav and footer link that used to point at `index.html#tests` or
`index.html#packages` now points here. The home page keeps its own short `#tests` and
`#packages` sections as a summary, and its in-page links still work.

## The booking form is not connected yet

`#bform` currently validates the name and 10-digit phone number, then shows a success
message locally. **No request is sent anywhere.** To make it real, replace the success
branch in the `f.addEventListener("submit", ...)` handler in `assets/js/main.js` with a
`fetch()` to your backend, a form service, or a WhatsApp deep link.

## Images

Photos currently come from Unsplash URLs. Each `<img>` carries an
`onerror="kFall(this,'key')"` fallback that swaps in an inline SVG illustration, so a
blocked or slow photo never breaks the layout. To use your own photography, drop files
into `Images/` and point the `src` at them — keep the `onerror` attribute.

## Running it locally

Open `index.html` directly, or serve the folder so relative paths behave exactly as they
will in production:

```bash
npx serve .
# or
python -m http.server 8000
```

## Deploying

Upload the whole folder as-is. Then:

1. Replace `https://kaminiclinicandlabs.in/` in the `<link rel="canonical">` tags,
   `robots.txt` and `sitemap.xml` with the real domain.
2. Configure the host to serve `404.html` for unknown paths.
3. Update the "Last updated" dates in `privacy.html` and `terms.html`, and have the two
   legal pages reviewed before going live — they are a solid starting draft, not legal advice.
