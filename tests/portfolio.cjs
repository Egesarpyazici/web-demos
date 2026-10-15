const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const url =
  process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:8000/web-demos/";
fs.mkdirSync("/tmp/portfolio-qa", { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  for (const width of [320, 375, 390, 520, 521, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(url);
    assert.equal(
      await page.title(),
      "Ege Sarp Yazıcı — Independent Web Developer",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow at ${width}`,
    );
    assert.equal(await page.locator(".project").count(), 5);
    const broken = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .filter((a) => !document.getElementById(a.hash.slice(1)))
          .map((a) => a.outerHTML),
      );
    assert.deepEqual(broken, []);
    console.log(`PASS layout, five concepts, anchors: ${width}px`);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: `/tmp/portfolio-qa/${width}.png`,
        fullPage: true,
      });
  }
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload();
  const menu = page.getByRole("button", { name: "Menu" });
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  await menu.click();
  assert.equal(await menu.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert(await menu.evaluate((e) => e === document.activeElement));
  await menu.click();
  await page.locator('#main-nav a[href="#work"]').click();
  assert.equal(await menu.getAttribute("aria-expanded"), "false");
  assert.equal(await page.evaluate(() => document.activeElement.id), "work");
  await page.setViewportSize({ width: 1024, height: 900 });
  assert(await page.locator("#main-nav").isVisible());
  console.log("PASS menu, Escape, focus transfer, breakpoint reset");
  await page.goto(url);
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement.className),
    "skip-link",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  assert.equal(await page.locator('a[href^="mailto:"]').count(), 0);
  assert.equal(await page.locator("#social-links a").count(), 1);
  assert.equal(
    await page.locator("#social-links a").getAttribute("href"),
    "https://github.com/Egesarpyazici",
  );
  console.log("PASS skip link, reduced motion, honest unconfigured contact");
  await page.route("**/assets/config.js", (r) =>
    r.fulfill({
      contentType: "application/javascript",
      body: `window.PORTFOLIO_CONFIG={email:'hello@example.com',github:'https://github.com/example',linkedin:'javascript:alert(1)'}`,
    }),
  );
  await page.reload();
  assert.equal(await page.locator('a[href^="mailto:"]').count(), 1);
  assert.equal(await page.locator("#social-links a").count(), 1);
  assert.equal(
    await page.locator("#social-links a").getAttribute("href"),
    "https://github.com/example",
  );
  console.log("PASS configured contact and rejection of unsafe social URL");
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const fallback = await nojs.newPage();
  await fallback.goto(url);
  assert(await fallback.locator("#main-nav").isVisible());
  assert.equal(await fallback.locator(".project").count(), 5);
  console.log("PASS no-JavaScript navigation/content");
  assert.deepEqual(errors, []);
  console.log("PASS no browser exceptions or failed HTTP responses");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
