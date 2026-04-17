// Record the live demo of gpz12138.github.io and take still screenshots.
//
// Usage:
//   cd scripts && npm init -y && npm i playwright
//   node record_demo.mjs
//
// Produces (next to this script):
//   recordings/demo.webm                — full scroll-through recording
//   ../examples/screenshots/desktop-light.png
//   ../examples/screenshots/desktop-dark.png
//   ../examples/screenshots/mobile-portrait.png
//
// A companion ffmpeg command converts demo.webm → demo.gif (see webm2gif.sh).

import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Points at the local demo site under examples/demo-site/ served via
// `python3 -m http.server 8931`. Override with SITE_URL env var if needed.
const SITE_URL = process.env.SITE_URL || "http://127.0.0.1:8931/";
const OUT_REC  = path.join(__dirname, "recordings");
const OUT_IMG  = path.resolve(__dirname, "..", "examples", "screenshots");

async function ensureDirs() {
  await mkdir(OUT_REC, { recursive: true });
  await mkdir(OUT_IMG, { recursive: true });
}

async function stillScreenshot({ name, viewport, colorScheme, forceDark = false }) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport,
    colorScheme,
    deviceScaleFactor: 2,
  });

  // Seed localStorage so the site boots in the requested theme immediately,
  // before any flash-of-wrong-theme happens.
  if (forceDark) {
    await ctx.addInitScript(() => {
      try {
        // Seed every plausible storage key for the site's theme preference.
        for (const k of ["pg-theme", "theme", "pz-theme", "site-theme"]) {
          localStorage.setItem(k, "dark");
        }
      } catch (e) {}
    });
  }

  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(800);

  // Click the theme toggle until we get dark. Site's own JS may have its
  // own storage key we don't know, so the init-script seed is not reliable —
  // clicking the toggle is the source of truth.
  if (forceDark) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const isDark = await page.evaluate(() => {
        const root = document.documentElement;
        const attr = root.getAttribute("data-theme");
        if (attr) return attr === "dark";
        const bg = getComputedStyle(document.body).backgroundColor;
        const m = bg.match(/\d+/g);
        if (!m) return false;
        const lum = (parseInt(m[0]) + parseInt(m[1]) + parseInt(m[2])) / 3;
        return lum < 80;
      });
      if (isDark) break;

      const toggle = page
        .locator(
          '#themeToggle, .theme-toggle, [aria-label*="theme" i], [title*="theme" i]',
        )
        .first();
      if (await toggle.count()) {
        await toggle.click().catch(() => {});
      } else {
        // Last resort: click whatever sits near the top-right that looks like a button
        const topRight = page.locator("header button").first();
        if (await topRight.count()) await topRight.click().catch(() => {});
      }
      await page.waitForTimeout(500);
    }
  }

  const outPath = path.join(OUT_IMG, `${name}.png`);
  await page.screenshot({ path: outPath, fullPage: false });
  console.log("  wrote", outPath);
  await ctx.close();
  await browser.close();
}

async function scrollVideo() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    recordVideo: { dir: OUT_REC, size: { width: 1280, height: 800 } },
  });
  const page = await ctx.newPage();
  await page.goto(SITE_URL, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);

  const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
  const viewportH    = 800;
  const steps        = 60;
  const maxY         = Math.max(0, scrollHeight - viewportH);

  for (let i = 0; i <= steps; i++) {
    const y = Math.round((maxY * i) / steps);
    await page.evaluate((yv) => window.scrollTo({ top: yv, behavior: "auto" }), y);
    await page.waitForTimeout(120);
  }

  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "auto" }));
  await page.waitForTimeout(600);

  await page.close();
  await ctx.close();
  await browser.close();
  console.log("  video written under", OUT_REC);
}

(async () => {
  await ensureDirs();

  console.log("Still: desktop light");
  await stillScreenshot({
    name: "desktop-light",
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });

  console.log("Still: desktop dark");
  await stillScreenshot({
    name: "desktop-dark",
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
    forceDark: true,
  });

  console.log("Still: mobile portrait");
  await stillScreenshot({
    name: "mobile-portrait",
    viewport: { width: 390, height: 844 },
    colorScheme: "light",
  });

  console.log("Video: desktop scroll-through");
  await scrollVideo();

  console.log("Done.");
})();
