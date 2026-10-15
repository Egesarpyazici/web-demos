/* Cold-cache mobile smoke test with real CDP network/CPU throttling. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const base =
  process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:8000/web-demos/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const slug of [
      "",
      "clinic",
      "tour-rental",
      "missed-inquiries",
      "business-dashboard",
      "marketing-game",
    ]) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.goto(base + (slug ? `projects/${slug}/` : ""), {
        timeout: 60000,
      });
      if (!slug) {
        await page.locator(".menu-toggle").click();
        assert.equal(
          await page.locator(".menu-toggle").getAttribute("aria-expanded"),
          "true",
        );
      }
      if (slug === "clinic") {
        await page.locator("#language").selectOption("de");
        assert.equal(await page.locator("html").getAttribute("lang"), "de");
      }
      if (slug === "tour-rental") {
        await page.locator("#extra-host").check();
        assert(await page.locator("#extra-host").isChecked());
      }
      if (slug === "missed-inquiries") {
        await page.locator("#minutes").fill("20");
        assert.equal(await page.locator("#minutes-range").inputValue(), "20");
      }
      if (slug === "business-dashboard") {
        await page.locator("#period").selectOption("7");
        assert.equal(await page.locator("#period").inputValue(), "7");
      }
      if (slug === "marketing-game") {
        await page.locator(".card").first().click();
        assert.equal(await page.locator(".card.is-revealed").count(), 1);
      }
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      );
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${slug || "portfolio"}: cold cache, 150ms latency, 1.6 Mbps down, 4x CPU, mobile interaction`,
      );
      await context.close();
    }
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
