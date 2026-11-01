#!/usr/bin/env node
/* =====================================================================
   Export the finished homepage mockup for submission.
   ---------------------------------------------------------------------
   Produces (into ./exports):
     • lumen-lens-homepage-desktop.pdf  — full-page PDF, 1440px wide
     • lumen-lens-homepage-desktop.png  — full-page desktop capture
     • lumen-lens-homepage-mobile.png   — full-page 390px capture
     • lumen-lens-mega-menu.png         — mega menu open state
   Requires a Chromium binary. Set CHROMIUM_PATH, or install the helper
   used in CI:  npm i -D puppeteer-core @sparticuz/chromium
   Usage: node scripts/export.mjs [--serve]
   ===================================================================== */
import { createRequire } from "node:module";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "exports");
const PORT = Number(process.env.PORT || 4173);
const URL_BASE = process.env.URL_BASE || `http://127.0.0.1:${PORT}/`;

let puppeteer;
let chromium;
try {
  puppeteer = require("puppeteer-core");
  chromium = require("@sparticuz/chromium");
} catch {
  console.error(
    "Missing export dependencies. Install them first:\n" +
      "  npm i -D puppeteer-core @sparticuz/chromium\n" +
      "(or point CHROMIUM_PATH at a local Chrome/Chromium binary)"
  );
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

/* Optional static server so the script is a one-liner. */
let server = null;
if (process.argv.includes("--serve")) {
  server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: root,
    stdio: "ignore",
  });
  console.log(`· serving ${root} on ${URL_BASE}`);
  await new Promise((r) => setTimeout(r, 1200));
}

const executablePath =
  process.env.CHROMIUM_PATH ||
  (existsSync("/tmp/chromium") ? "/tmp/chromium" : await chromium.executablePath());

const browser = await puppeteer.launch({
  args: [...(chromium.args || []), "--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
  executablePath,
  headless: "shell",
});

/** Scroll the page so lazy images load, then force every reveal visible.
    NOTE: the page uses `scroll-behavior: smooth`, so the sweep uses
    `behavior: "instant"` — otherwise the scripted scroll never actually
    reaches the lower sections and scroll-revealed cards stay at opacity 0
    in the exported PDF. Reveals are also forced on as a belt-and-braces
    guarantee that no content is missing from the submission files. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    const step = window.innerHeight * 0.7;
    let guard = 0;
    for (let y = 0; y < document.body.scrollHeight && guard < 60; y += step, guard += 1) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 160));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    root.style.scrollBehavior = previous;
    await new Promise((r) => setTimeout(r, 300));
  });

  await page.evaluate(() =>
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"))
  );
  await page.evaluate(async () => {
    const pending = [...document.images].filter((img) => !img.complete);
    const wait = Promise.all(
      pending.map((img) => new Promise((r) => {
        img.addEventListener("load", r, { once: true });
        img.addEventListener("error", r, { once: true });
      }))
    );
    /* never let a stalled request block the export */
    await Promise.race([wait, new Promise((r) => setTimeout(r, 6000))]);
  });
  await new Promise((r) => setTimeout(r, 250));
}

/** Fail loudly if any image failed to load or any reveal is still hidden. */
async function assertComplete(page, label) {
  const report = await page.evaluate(() => ({
    broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    hidden: [...document.querySelectorAll(".reveal")].filter(
      (el) => parseFloat(getComputedStyle(el).opacity) < 0.99
    ).length,
  }));
  if (report.broken.length) throw new Error(`${label}: ${report.broken.length} broken image(s): ${report.broken.join(", ")}`);
  if (report.hidden) throw new Error(`${label}: ${report.hidden} reveal element(s) still transparent`);
  console.log(`· ${label}: all images loaded, all sections visible`);
}

try {
  /* ------------------------- Desktop ------------------------- */
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  await page.goto(URL_BASE, { waitUntil: "networkidle0" });
  await settle(page);
  await assertComplete(page, "desktop");

  const height = await page.evaluate(() => document.body.scrollHeight);
  console.log(`· desktop page height ${height}px`);

  await page.screenshot({
    path: join(outDir, "lumen-lens-homepage-desktop.png"),
    fullPage: true,
  });
  console.log("✓ lumen-lens-homepage-desktop.png");

  /* Single continuous PDF page = a true full-page mockup */
  await page.pdf({
    path: join(outDir, "lumen-lens-homepage-desktop.pdf"),
    width: "1440px",
    height: `${height + 8}px`,
    printBackground: true,
    pageRanges: "1",
    margin: { top: "0", bottom: "0", left: "0", right: "0" },
  });
  console.log("✓ lumen-lens-homepage-desktop.pdf");

  /* ---------------------- Mega menu state -------------------- */
  const mega = await browser.newPage();
  await mega.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 });
  await mega.goto(`${URL_BASE}?mega=open`, { waitUntil: "networkidle0" });
  await settle(mega);
  await assertComplete(mega, "mega menu");
  await mega.evaluate(() => document.querySelector("[data-mega]").classList.add("is-open"));
  await new Promise((r) => setTimeout(r, 500));
  await mega.screenshot({
    path: join(outDir, "lumen-lens-mega-menu.png"),
    clip: { x: 0, y: 0, width: 1440, height: 620 },
  });
  console.log("✓ lumen-lens-mega-menu.png");

  /* --------------------------- Mobile ------------------------ */
  const mobile = await browser.newPage();
  /* 1.5× keeps the very tall full-page bitmap inside Chromium's limits */
  await mobile.setViewport({ width: 390, height: 844, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  await mobile.goto(URL_BASE, { waitUntil: "networkidle0" });
  await settle(mobile);
  await assertComplete(mobile, "mobile");
  await mobile.screenshot({
    path: join(outDir, "lumen-lens-homepage-mobile.png"),
    fullPage: true,
  });
  console.log("✓ lumen-lens-homepage-mobile.png");
} finally {
  await browser.close();
  if (server) server.kill();
}

console.log(`\nDone — mockup exports written to ${outDir}`);
