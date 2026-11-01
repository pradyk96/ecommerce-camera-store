#!/usr/bin/env node
/* =====================================================================
   Option A — automated checklist audit
   Runs with zero dependencies:  node scripts/qa.mjs
   Verifies section structure, component counts, copy rules, a11y basics
   and that every referenced local asset exists.
   ===================================================================== */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = readFileSync(join(root, "index.html"), "utf8");
const css = readFileSync(join(root, "assets/css/styles.css"), "utf8");

let pass = 0;
let group = "1 · Canvas, header & mega menu";
const failures = [];
const results = [];

const GROUP = (title) => { group = title; };

function check(label, condition, detail = "") {
  const ok = Boolean(condition);
  if (ok) pass += 1;
  else failures.push(`${group.split(" · ")[1] ?? group}: ${label}` + (detail ? ` — ${detail}` : ""));
  results.push({ ok, label, detail, group });
}

/* ------------------------------ helpers ---------------------------- */
const section = (id) => {
  const m = html.match(new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`));
  return m ? m[0] : "";
};

/** Strip tags + entities and return the word list. */
const words = (fragment) =>
  fragment
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .split(/\s+/)
    .filter((token) => /[a-z0-9]/i.test(token));

const count = (haystack, needle) => haystack.split(needle).length - 1;

const hero = section("hero");
const categories = section("categories");
const featured = section("featured");
const promo = section("promo");
const seo = section("seo");
const header = (html.match(/<header[\s\S]*?<\/header>/) || [""])[0];
const footer = (html.match(/<footer[\s\S]*?<\/footer>/) || [""])[0];
const seoBody = (seo.match(/<div class="seo__body"[\s\S]*?<\/div>/) || [""])[0];
const mega = (header.match(/<div class="mega"[\s\S]*?<div class="mega__foot"/) || [""])[0];
const seoWords = words(seoBody);

/* ------------------------- 1. Header / nav ------------------------- */
check("Header: placeholder logo present", /brand__name[^>]*>\s*Lumen/.test(html));
check("Header: utility icons (search, wishlist, cart)", ["i-search", "i-heart", "i-bag"].every((i) => header.includes(i)));
check(
  "Header: 5 primary nav links (Cameras, Lenses, Accessories, Brands, Sale)",
  ["Cameras", "Lenses", "Accessories", "Brands", "Sale"].every((label) => new RegExp(`>\\s*${label}\\b`).test(header))
);

/* ------------------------- 2. Mega menu ---------------------------- */
const megaCols = count(mega, 'class="mega__col"');
check("Mega menu: panel exists with column structure", mega.length > 0 && megaCols >= 4, `${megaCols} columns`);
check(
  "Mega menu: required sub-links (Mirrorless, DSLR, Medium Format, Cinematic)",
  ["Mirrorless", "DSLR", "Medium Format", "Cinematic"].every((label) => mega.includes(label))
);
check("Mega menu: grouped by category headings", /Shop by type|By discipline|By sensor/.test(mega));
check("Mega menu: aria-expanded state wired", /aria-expanded="false"\s+aria-controls="mega-cameras"/.test(header));
check(
  "Mega menu: hover state styled",
  /\.nav-item--mega\.is-open > \.mega/.test(css) && /\.nav-link:hover/.test(css)
);
check("Mega menu: focus-visible (keyboard) state styled", /:focus-visible/.test(css));
check(
  "Mega menu: hover works regardless of pointer media query",
  /mouseenter/.test(readFileSync(join(root, "assets/js/main.js"), "utf8")) &&
    !/hover: hover/.test(readFileSync(join(root, "assets/js/main.js"), "utf8"))
);
check("Mega menu: demo hook to open via ?mega=open", /params\.get\("mega"\) === "open"/.test(readFileSync(join(root, "assets/js/main.js"), "utf8")));

/* ---------------------------- 3. Hero ----------------------------- */
GROUP("4 · Hero banner");
check("Hero: exactly one hero banner", count(html, 'class="hero"') === 1);
check("Hero: immersive background image", /class="hero__media"[\s\S]*?<img/.test(hero));
check("Hero: bold headline", /<h1[^>]*class="hero__title"[\s\S]*?Capture Your World[\s\S]*?<\/h1>/.test(hero));
check("Hero: tagline present", /hero__tagline/.test(hero) && /professional-grade mirrorless cameras/i.test(hero));
check("Hero: primary CTA 'Shop New Releases'", /Shop New Releases/.test(hero) && /btn--primary/.test(hero));

/* ------------------------ 4. Category grid ------------------------ */
GROUP("5 · Category grid");
const categoryCards = count(categories, '<li class="category-card');
check("Categories: exactly 3 cards", categoryCards === 3, `found ${categoryCards}`);
check(
  "Categories: 3-column horizontal grid",
  /\.category-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3/.test(css)
);
check(
  "Categories: titles for bodies, lenses, studio",
  ["Mirrorless Bodies", "Prime &amp; Zoom Lenses", "Studio &amp; Lighting"].every((t) => categories.includes(t))
);
check(
  "Categories: each card has a representative image",
  count(categories, "<img") === 3,
  `${count(categories, "<img")} images`
);

/* ----------------------- 5. Featured products --------------------- */
GROUP("6 · Featured products");
const productCards = featured.split('<li class="product-card').slice(1);
check("Featured: exactly 4 product cards", productCards.length === 4, `found ${productCards.length}`);
check(
  "Featured: 4-column grid",
  /\.product-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4/.test(css)
);
const everyCard = (test) => productCards.every(test);
check("Featured: every card has a product image", everyCard((c) => /<img\s/.test(c)));
check("Featured: every card has a title", everyCard((c) => /product-card__title/.test(c) && /<a href/.test(c)));
check("Featured: every card has a price tag ($x,xxx.00)", everyCard((c) => /\$\d[\d,]*\.\d{2}/.test(c)));
check("Featured: every card has a rating indicator", everyCard((c) => /class="stars"\s+style="--rating:\d/.test(c)));
check("Featured: every card has a quick action", everyCard((c) => /data-quick-add/.test(c)));
check("Featured: wishlist quick action on every card", everyCard((c) => /class="wish-btn"/.test(c)));

/* -------------------------- 6. Promo ------------------------------ */
GROUP("7 · Promo banner");
check("Promo: full-width banner section", /class="promo"/.test(html) && /\.promo\s*\{[^}]*position:\s*relative/.test(css));
check("Promo: headline 'Summer Gear Trade-In Event'", /Summer Gear Trade-In Event/.test(promo));
check("Promo: offer copy 'up to $500 back'", /get up to[\s\S]*?\$500/.test(promo));
check("Promo: CTA 'Shop Trade-In Deals'", /Shop Trade-In Deals/.test(promo));

/* --------------------------- 7. SEO ------------------------------- */
GROUP("8 · SEO content");
check("SEO: section exists", seo.length > 0);
check("SEO: optimised heading", /The Ultimate Destination for Professional Photography Gear/.test(seo));
check("SEO: exactly 175 words of body copy", seoWords.length === 175, `found ${seoWords.length}`);
check("SEO: dedicated image space", /class="seo__media"[\s\S]*?<img/.test(seo));
check("SEO: copy mentions selections, advice, warranty, shipping",
  /catalogue/i.test(seo) && /specialists/i.test(seo) && /warranty/i.test(seo) && /shipping|ship/i.test(seo));

/* -------------------------- 8. Footer ----------------------------- */
GROUP("9 · Footer & newsletter");
check("Footer: newsletter email field", /id="newsletterEmail"[^>]*type="email"/.test(footer));
check("Footer: Subscribe button", />\s*Subscribe\s*</.test(footer));
const footerCols = (footer.match(/class="footer-col__title"/g) || []).length;
check("Footer: 4 link directories", footerCols === 4, `found ${footerCols}`);
check(
  "Footer: Shop, Customer Support, About Us, Privacy & Terms columns",
  ["Shop", "Customer Support", "About Us", "Privacy &amp; Terms"].every((t) => new RegExp(`>\\s*${t}\\s*<`).test(footer))
);
check(
  "Footer: social icons (Instagram, YouTube, X, Facebook)",
  ["Instagram", "YouTube", "on X", "Facebook"].every((t) => footer.includes(t))
);
check("Footer: copyright strip", /©\s*2026 Lumen &amp; Lens/.test(footer));

/* ------------------- 9. Cross-cutting quality --------------------- */
GROUP("10 · Quality, a11y & assets");
const imgs = html.match(/<img\s[^>]*>/g) || [];
check("A11y: every <img> has an alt attribute", imgs.every((tag) => /\salt="[^"]*"/.test(tag)), `${imgs.length} images`);
check("Markup: exactly one <h1>", count(html, "<h1") === 1);
check(
  "Markup: single <main> landmark + skip link",
  count(html, "<main") === 1 && /class="skip-link"/.test(html)
);
const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
check("Markup: no duplicate IDs", new Set(ids).size === ids.length, `${ids.length} ids`);

const refs = new Set();
for (const m of html.matchAll(/(?:src|href|imagesrcset|srcset)="([^"]+)"/g)) {
  if (/^(data:|https?:|mailto:|tel:)/.test(m[1].trim())) continue;
  m[1].split(",").forEach((candidate) => {
    const url = candidate.trim().split(/\s+/)[0];
    if (!url || /^(#|https?:|data:|mailto:|tel:)/.test(url)) return;
    refs.add(url.replace(/^\.\//, ""));
  });
}
const missing = [...refs].filter((url) => !existsSync(join(root, url)));
check("Assets: every local src/srcset/href resolves", missing.length === 0, missing.join(", "));
check("Assets: responsive srcset used for imagery", /srcset=/.test(html) && /<picture>/.test(html));
check("Performance: hero image preloaded", /rel="preload"[^>]*as="image"/.test(html));
check("Performance: fonts self-hosted (no external font CDN)", !/@import|fonts\.googleapis/.test(css));
check("A11y: reduced-motion support", /prefers-reduced-motion/.test(css));
check("Print: print stylesheet for PDF export", /@media print/.test(css));

/* ---------------------------- report ------------------------------ */
let renderedGroup = "";
results.forEach((r) => {
  if (r.group !== renderedGroup) {
    renderedGroup = r.group;
    console.log(`\n\x1b[1m${r.group}\x1b[0m`);
  }
  const mark = r.ok ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
  const detail = r.ok ? "" : `  \x1b[31m(${r.detail})\x1b[0m`;
  console.log(`  ${mark} ${r.label}${detail}`);
});

const verdict = failures.length === 0 ? "\x1b[32mPASS\x1b[0m" : "\x1b[31mFAIL\x1b[0m";
console.log(`\n\x1b[1m${verdict} — ${pass}/${results.length} checks passed\x1b[0m`);
if (failures.length) {
  console.log("\x1b[31mFailures:\x1b[0m");
  failures.forEach((f) => console.log("  • " + f));
  process.exitCode = 1;
}
