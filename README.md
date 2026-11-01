# Lumen & Lens — E-commerce Camera Store Homepage (Option A)

A production-minded, developer-friendly **homepage mockup** for a high-end camera
store, built to the Option A layout specification. No frameworks, no build step,
no runtime dependencies — just semantic HTML, a token-driven CSS design system and
one small progressive-enhancement script.

```
open index.html          # or: npx serve .
```

---

## Option A checklist → where it lives

| Requirement | Status | Implementation |
| --- | --- | --- |
| 1440px desktop canvas, 12-column grid, consistent padding & whitespace | ✅ | `--container: 1440px`, `--gutter`, `.grid-12` + every section snaps to a 12-col span |
| Palette: deep charcoal, crisp white, amber CTA accent | ✅ | `--ink-900 #0d0c0b`, `--paper #ffffff`, `--amber #f2a03d` in `:root` |
| Logo top-left + utility icons right (search, wishlist, cart) | ✅ | `.brand` with inline SVG mark; `.nav-search` + three `.icon-btn` with count badges |
| Primary nav: Cameras, Lenses, Accessories, Brands, Sale | ✅ | `.nav-list` |
| **Mega menu on "Cameras"** with categorised columns (Mirrorless, DSLR, Medium Format, Cinematic) | ✅ | `.mega` panel — 4 link columns + promo tile; hover, click, focus, Esc, `?mega=open` |
| **Single** full-width hero: headline, tagline, high-contrast CTA, cinematic background | ✅ | `#hero` — "Capture Your World in Ultra HD" / "Explore professional-grade mirrorless cameras…" / "Shop New Releases" |
| **Exactly 3** category cards with image + bold title | ✅ | `#categories` → Mirrorless Bodies, Prime & Zoom Lenses, Studio & Lighting |
| **Exactly 4** featured products: image, title, price, quick action/rating | ✅ | `#featured` → image, title, `$x,xxx.00`, 5-star rating, wishlist + quick-add |
| Full-width promo banner between sections | ✅ | `#promo` — "Summer Gear Trade-In Event · up to $500 back · Shop Trade-In Deals" |
| SEO block: heading, **exactly 175 words**, image space | ✅ | `#seo` → `[data-seo-body][data-word-count="175"]`, audited automatically |
| Footer: newsletter (input + Subscribe), 4 link directories, 4 socials, copyright | ✅ | `#footer` → Shop / Customer Support / About Us / Privacy & Terms, Instagram · YouTube · X · Facebook |
| Export for submission | ✅ | `exports/lumen-lens-homepage-desktop.pdf` (+ desktop/mobile PNG, mega-menu state) |

Run the audit any time:

```
npm run qa        # node scripts/qa.mjs  → 53/53 checks
```

---

## Structure

```
index.html                     # the mockup (single page, semantic sections)
assets/css/styles.css          # design tokens → components → responsive → print
assets/js/main.js              # mega menu, mobile drawer, wishlist, quick add, newsletter
assets/fonts/                  # self-hosted Inter Variable + Instrument Serif (OFL)
assets/img/*.webp + *.jpg      # responsive derivatives (480–1983px)
assets/img/src/*.jpg           # master artwork, not referenced by the page
scripts/qa.mjs                 # dependency-free Option A checklist audit
scripts/optimize-images.sh     # regenerates every responsive derivative
scripts/export.mjs             # renders the PDF + PNG submission files
exports/                       # final mockup files
```

### Design tokens

Everything visual is driven by custom properties at the top of `styles.css` —
change `--amber` to `#3b7dff` for an electric-blue accent, or `--fs-h1` for scale.
Spacing rhythm comes from `--gutter`, `--col-gap` and `--section-y`.

### Interaction model

* **Mega menu** — opens on hover and on keyboard focus, toggles on click below
  1080px, closes on `Esc`, outside click, or focus leaving the item. `aria-expanded`
  is kept in sync. Append `?mega=open` (or link to `#mega-cameras`) to force the open
  state for screenshots, reviews or QA.
* **Responsive** — 4-col → 2-col → 1-col products; 3-col → stacked categories;
  the mega panel becomes an accordion inside the mobile drawer.
* **Accessibility** — skip link, single `<h1>`, labelled landmarks, visible focus
  rings, `aria-live` newsletter feedback, alt text on all imagery, and full
  `prefers-reduced-motion` support.
* **Progressive enhancement** — all content renders without JavaScript; the reveal
  animations are opt-in via an `html.js` class.

### Performance notes

* WebP with JPEG fallback through `<picture>`, `srcset`/`sizes` on every image,
  `loading="lazy"` below the fold, `fetchpriority="high"` + preload on the hero.
* Fonts are self-hosted and preloaded — no third-party requests, nothing to block
  first paint on an external CDN.
* Zero JavaScript or CSS dependencies; total CSS ~2 files, JS ~250 lines.

---

## Commands

```bash
npm run serve            # static preview on http://localhost:4173
npm run qa               # structure / copy / asset audit
npm run images           # rebuild responsive image derivatives (needs ImageMagick)
npm run export           # render PDF + PNGs into ./exports (needs Chromium)
```

`npm run export` needs `puppeteer-core` and `@sparticuz/chromium` (dev-only):

```bash
npm install --no-save puppeteer-core @sparticuz/chromium
npm run export
```

Set `CHROMIUM_PATH=/path/to/chrome` to use a local browser instead. The PDF is
generated as one continuous page (1440px wide) so the mockup keeps its full-page
rhythm, with print styles that keep every required element visible.

---

## Placeholder content

Brand name (**Lumen & Lens**), product names, prices, review counts, addresses and
all imagery are fictional placeholders for mockup purposes. Body copy in the SEO
section is lorem-ipsum-style SEO copy held to exactly 175 words; the fourth
paragraph of marketing filler on the product grid is intentionally lorem ipsum.
Fonts: Inter (Rasmus Andersson) and Instrument Serif, both SIL OFL 1.1 —
licences included in `assets/fonts/`.
