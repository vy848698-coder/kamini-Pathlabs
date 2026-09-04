| `assets/css/pages.css` | `<head>`, inner pages only | Overrides layered on top of `style.css` |
| `assets/css/about.css` | `<head>`, `about.html` only | Loaded last; every rule is prefixed `.ab-` |
| `assets/css/about.css` | `<head>`, `about.html` only | Loaded last; every rule is prefixed `.ab-` |
# Kamini Clinic &amp; Labs — Website

Static marketing + booking site for **Kamini Clinic & Labs**, a diagnostic centre in
Jagamara, Khandagiri, Bhubaneswar. No build step, no framework — plain HTML, CSS and
vanilla JavaScript, so it can be dropped onto any static host.

## File layout

```
kamini-Pathlabs/
├── index.html                  Home page (hero, programmes, tests, packages, FAQ, booking)
├── about.html                  About Us (story, timeline, values, quality, visit)
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
│   │   └── about.css           Everything unique to about.html (all .ab- prefixed)
│   └── js/
│       ├── image-fallback.js   Inline-SVG placeholders when a photo fails to load
│       └── main.js             All page behaviour (see below)
└── Images/                     Local photography goes here
```

## How the pages are wired

Every page loads the same core assets, in this order:

| Asset | Where | Why the order matters |
| --- | --- | --- |
| `assets/css/style.css` | `<head>` | Design tokens + all component styles |
| `assets/css/pages.css` | `<head>`, inner pages only | Overrides layered on top of `style.css` |
| `assets/css/about.css` | `<head>`, `about.html` only | Loaded last; every rule is prefixed `.ab-` |
| `assets/js/image-fallback.js` | `<head>`, **blocking** | Defines `kFall()` before any `<img onerror>` can fire |
| `assets/js/main.js` | end of `<body>`, `defer` | Runs after the DOM is parsed |

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
- About-page chapter rail spy + sideways auto-scroll (`#chap`)
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
