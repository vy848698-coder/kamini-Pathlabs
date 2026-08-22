# Images

`Images/` holds the **original, full-resolution** photography — keep these as the master
copies. Nothing on the site links to them directly.

`Images/optimized/` holds the web-sized versions the pages actually load. They are
resized to roughly 2x their largest display size and re-encoded as JPEG, which took the
set from ~13 MB down to ~650 KB with no visible quality loss.

| optimized file | size | used by |
| --- | --- | --- |
| hero-section-1.jpg | 800x1200 | hero, large frame |
| hero-section-2.jpg | 800x520 | hero, small inset card |
| Full-body-checkup.jpg | 1400x933 | carousel slide 1 |
| expert-care.jpg | 1400x788 | carousel slide 2 |
| imaging-cardiology.jpg | 933x1400 | carousel slide 3 |
| home-trust.jpg | 1386x1135 | carousel slide 4 |

## Replacing a photo

1. Drop the full-size original in `Images/`.
2. Produce a web-sized copy in `Images/optimized/` (Squoosh.app is the easiest route —
   long edge around 1400px, JPEG quality ~82).
3. Point the `<img src>` at the optimized copy and update its `width`/`height`
   attributes to the new pixel size — they prevent layout shift while the image loads.

Keep the `onerror="kFall(this,'key')"` attribute on every `<img>`. It swaps in an inline
SVG illustration if the file is missing, so the layout never collapses.
Available keys (in `assets/js/image-fallback.js`): `lab`, `vials`, `micro`, `fam`,
`home`, `scan`.

## Framing

Each carousel `.pimg` sets a `--fp` custom property (e.g. `--fp:58% 46%`) which drives
`object-position`. Adjust it if a new photo's subject sits somewhere else — the left
~45% of the panel is covered by the gradient that blends into the text.
