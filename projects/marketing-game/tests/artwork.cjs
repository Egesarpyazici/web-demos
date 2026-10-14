/* Development-only image, layout and configuration regression checks. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base =
  process.env.MARKETING_GAME_TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/marketing-game/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });
    await page.goto(base);
    await page.locator(".card").last().waitFor();
    const bottom = await page
      .locator("#board")
      .evaluate((e) => e.getBoundingClientRect().bottom);
    assert(bottom < 900, `All desktop cards should fit: ${bottom}`);
    const files = fs
      .readdirSync(path.join(__dirname, "../assets/art"))
      .filter((f) => f.endsWith(".webp"));
    assert.equal(files.length, 10);
    let total = 0;
    for (const file of files) {
      total += fs.statSync(path.join(__dirname, "../assets/art", file)).size;
      const dimensions = await page.evaluate(async (src) => {
        const img = new Image();
        img.src = src;
        await img.decode();
        return [img.naturalWidth, img.naturalHeight];
      }, "assets/art/" + file);
      assert.deepEqual(
        dimensions,
        file.includes("-large") ? [960, 960] : [384, 384],
      );
    }
    assert(total < 300000);
    const source = fs.readFileSync(
      path.join(__dirname, "../assets/app.js"),
      "utf8",
    );
    await page.route("**/assets/app.js", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: source
          .replace(
            'artwork: "assets/art/bloom.webp"',
            'artwork: "assets/art/orbit.webp"',
          )
          .replace(
            'hero: "assets/art/bloom-large.webp"',
            'hero: "assets/art/loop-large.webp"',
          ),
      }),
    );
    await page.reload();
    assert.match(
      await page.locator('[data-card="bloom-a"] img').getAttribute("src"),
      /orbit.webp$/,
    );
    assert.match(
      await page.locator('[data-artwork="hero"]').getAttribute("src"),
      /loop-large.webp$/,
    );
    await page.unroute("**/assets/app.js");
    await page.route("**/assets/art/bloom.webp", (route) => route.abort());
    await page.reload();
    await page.locator('[data-card="bloom-a"]').click();
    await page.locator('[data-card="bloom-b"]').click();
    assert.equal(await page.locator("#matched").innerText(), "1");
    assert(
      await page.locator('[data-card="bloom-a"] .artwork-unavailable').count(),
    );
    console.log(
      `PASS ten decoded local images, ${total} byte budget, desktop fit, artwork remapping and missing-image playable fallback`,
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
