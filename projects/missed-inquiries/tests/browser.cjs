/* Development only; npm dependencies live outside this static site. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const url =
  process.env.REPLYGAP_TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/missed-inquiries/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
      acceptDownloads: true,
    });
    const page = await context.newPage(),
      failures = [],
      external = [];
    page.on("pageerror", (e) => failures.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) failures.push(`${r.status()} ${r.url()}`);
    });
    page.on("request", (r) => {
      if (new URL(r.url()).origin !== new URL(url).origin)
        external.push(r.url());
    });
    fs.mkdirSync("/tmp/replygap-qa", { recursive: true });
    for (const width of [320, 390, 480, 600, 768, 800, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(url);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${width}`,
      );
      assert.equal(
        await page.locator("[data-result=missed]").first().innerText(),
        "$7,320.00",
      );
      assert.equal(await page.locator("h1").count(), 1);
      assert.deepEqual(
        await page
          .locator('a[href^="#"]')
          .evaluateAll((es) =>
            es
              .filter((e) => !document.getElementById(e.hash.slice(1)))
              .map((e) => e.hash),
          ),
        [],
      );
      assert.equal(
        await page
          .locator("img")
          .evaluateAll((es) => es.every((e) => e.complete && e.naturalWidth)),
        true,
      );
      assert(await page.locator(".demo").isVisible());
      const controls = await page
        .locator("input,select,button")
        .evaluateAll((es) =>
          es
            .filter((e) => {
              const r = e.getBoundingClientRect();
              return r.width && (r.left < 0 || r.right > innerWidth + 1);
            })
            .map((e) => e.id),
        );
      assert.deepEqual(controls, []);
      if ([390, 1440].includes(width)) {
        await page.screenshot({
          path: `/tmp/replygap-qa/${width}.png`,
          fullPage: true,
        });
        await page
          .locator("#calculator")
          .screenshot({ path: `/tmp/replygap-qa/workspace-${width}.png` });
      }
      console.log(
        `PASS layout, local route, anchors, controls and default results ${width}px`,
      );
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(url);
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.className),
      "skip",
    );
    assert.equal(
      await page
        .locator(".skip")
        .evaluate((e) => getComputedStyle(e).outlineStyle),
      "solid",
    );
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "main");
    await page.locator("#inquiries").fill("200");
    await page.locator("#value").fill("400");
    await page.locator("#minutes").fill("20");
    assert.equal(await page.locator("#inquiries-range").inputValue(), "200");
    assert.equal(await page.locator("#value-range").inputValue(), "400");
    assert.equal(await page.locator("#minutes-range").inputValue(), "20");
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "$7,200.00",
    );
    assert.equal(
      await page.locator("#potential-bar").getAttribute("width"),
      "500",
    );
    assert.equal(
      Number(await page.locator("#current-bar").getAttribute("width")),
      320,
    );
    assert(
      (await page.locator("#revenue-desc").textContent()).includes(
        "$12,800.00",
      ),
    );
    assert(
      (await page.locator("#summary").inputValue()).includes("$86,400.00"),
    );
    for (const [key, value] of [
      ["inquiries", "300"],
      ["value", "500"],
      ["minutes", "40"],
      ["conversion", "20"],
      ["retention", "90"],
    ]) {
      await page.locator("#" + key + "-range").fill(value);
      assert.equal(await page.locator("#" + key).inputValue(), value);
      await page.locator("#" + key).fill(value);
      assert.equal(
        await page.locator("#" + key + "-range").inputValue(),
        value,
      );
    }
    await page.locator("#retention-range").focus();
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.locator("#retention").inputValue(), "91");
    await page.locator("#reset").click();
    for (const [preset, current, missed] of [
      ["conservative", "$10,935.00", "$4,065.00"],
      ["moderate", "$7,680.00", "$7,320.00"],
      ["aggressive", "$3,240.00", "$11,760.00"],
    ]) {
      await page.locator(`[data-preset=${preset}]`).click();
      assert.equal(
        await page.locator("[data-result=current]").innerText(),
        current,
      );
      assert.equal(
        await page.locator("[data-result=missed]").first().innerText(),
        missed,
      );
      assert.equal(await page.locator("#inquiries").inputValue(), "240");
    }
    await page.locator("#reset").click();
    const curveBefore = await page.locator("#curve-line").getAttribute("d");
    await page.locator("#conversion").fill("30");
    assert.equal(
      await page.locator("#curve-line").getAttribute("d"),
      curveBefore,
    ); // normalized chart scale, rates/labels still change
    assert(
      (
        await page
          .locator('#curve-points [data-minutes="5"]')
          .getAttribute("aria-label")
      ).includes("30%"),
    );
    await page.locator("#retention").fill("60");
    assert.notEqual(
      await page.locator("#curve-line").getAttribute("d"),
      curveBefore,
    );
    await page.locator('#curve-points [data-minutes="20"]').focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.locator("#minutes").inputValue(), "20");
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.minutes),
      "20",
    );
    await page.keyboard.press("ArrowRight");
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.minutes),
      "60",
    );
    await page.keyboard.press(" ");
    assert.equal(await page.locator("#minutes").inputValue(), "60");
    await page.locator('#curve-points [data-minutes="240"]').click();
    assert.equal(await page.locator("#minutes").inputValue(), "240");
    await page.locator(".table-details summary").click();
    assert.equal(await page.locator("#chart-table tr").count(), 13);
    assert(
      (await page.locator("#chart-table tr").first().innerText()).includes(
        "0 min",
      ),
    );
    await page.locator("#reset").click();
    assert(
      (await page.locator("#chart-table tr").last().innerText()).includes(
        "$7,320.00",
      ),
    );
    assert(
      (await page.locator("#chart-table tr").last().innerText()).includes(
        "12.8%",
      ),
    );
    await page.locator("#currency").selectOption("EUR");
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "€7,320.00",
    );
    await page.locator("#currency").selectOption("GBP");
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "£7,320.00",
    );
    assert.equal(await page.locator("#value").inputValue(), "250");
    console.log(
      "PASS independent live totals, all slider/number pairs, native slider keys, presets, chart geometry/data, chart keyboard/click, currency without conversion",
    );
    for (const [key, value] of [
      ["inquiries", ""],
      ["inquiries", "-1"],
      ["inquiries", "100001"],
      ["minutes", "10081"],
      ["minutes", "1.5"],
      ["value", "0.001"],
      ["conversion", "100.1"],
      ["retention", "0"],
    ]) {
      await page.locator("#" + key).fill(value);
      assert.equal(
        await page.locator("#" + key).getAttribute("aria-invalid"),
        "true",
      );
      assert.equal(
        await page.locator("[data-result=missed]").first().innerText(),
        "—",
      );
      assert(await page.locator("#copy").isDisabled());
      assert(await page.locator("#download").isDisabled());
      assert(await page.locator("#print").isDisabled());
      assert.equal(await page.locator("#summary").inputValue(), "");
      assert.equal(await page.locator("#curve-chart").isVisible(), false);
      await page.locator("#reset").click();
    }
    await page.locator("#inquiries").fill("0");
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "$0.00",
    );
    assert.equal(
      await page.locator("#potential-bar").getAttribute("width"),
      "0",
    );
    await page.locator("#reset").click();
    await page.locator("#value").fill("0");
    assert.equal(
      await page.locator("[data-result=conversions]").innerText(),
      "29.28",
    );
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "$0.00",
    );
    await page.locator("#reset").click();
    await page.locator('[data-time="5"]').click();
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "$0.00",
    );
    await page.locator('[data-time="1440"]').click();
    assert.equal(await page.locator("#minutes-range").inputValue(), "1440");
    await page.locator("#reset").click();
    await page.setViewportSize({ width: 320, height: 900 });
    for (const [key, value] of [
      ["inquiries", "100000"],
      ["value", "1000000"],
      ["conversion", "100"],
      ["minutes", "10080"],
      ["retention", "1"],
    ])
      await page.locator("#" + key).fill(value);
    assert.equal(
      await page.locator("[data-result=potential]").innerText(),
      "$100,000,000,000.00",
    );
    assert.equal(
      await page.locator("[data-result=annual]").innerText(),
      "$1,200,000,000,000.00",
    );
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.locator("#reset").click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    const summary = await page.locator("#summary").inputValue();
    await page.locator("#copy").click();
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      summary,
    );
    const downloadEvent = page.waitForEvent("download");
    await page.locator("#download").click();
    const download = await downloadEvent;
    assert.equal(download.suggestedFilename(), "replygap-scenario.txt");
    assert.equal(fs.readFileSync(await download.path(), "utf8"), summary);
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw Error("denied");
          },
        },
      }),
    );
    await page.locator("#copy").click();
    assert(
      (await page.locator("#copy-status").innerText()).includes("selected"),
    );
    assert.equal(
      await page
        .locator("#summary")
        .evaluate((e) => e.selectionEnd - e.selectionStart),
      summary.length,
    );
    await page.evaluate(
      () =>
        (window.print = () => {
          window.dispatchEvent(new Event("beforeprint"));
          window.__printCalled = true;
        }),
    );
    await page.locator("#print").click();
    assert(await page.evaluate(() => window.__printCalled));
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator(".print-text").innerText(), summary);
    assert.equal(await page.locator(".workspace").isVisible(), false);
    await page.emulateMedia({ media: "screen" });
    await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#retention").fill("100");
    assert.equal(
      await page.locator("[data-result=missed]").first().innerText(),
      "$0.00",
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    assert.equal(
      await page
        .locator(".primary-result [data-result=missed]")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    console.log(
      "PASS empty/invalid/extreme and zero inputs, stale-report clearing, copy and denied fallback, exact local download, print layout, reduced motion",
    );
    for (const width of [320, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator("#reset").click();
      await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      let results = await page.evaluate(async () =>
        (await axe.run()).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(results, [], `axe ${width} ${JSON.stringify(results)}`);
      await page.locator("#retention").fill("0");
      results = await page.evaluate(async () =>
        (await axe.run()).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(
        results,
        [],
        `axe invalid ${width} ${JSON.stringify(results)}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#reset").click();
    await page.locator("#inquiries").scrollIntoViewIfNeeded();
    await page.waitForFunction(
      () => !document.querySelector(".mobile-result").hidden,
    );
    assert.equal(
      await page.locator(".mobile-result [data-result=missed]").innerText(),
      "$7,320.00",
    );
    await page.locator(".mobile-result a").click();
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "results",
    );
    assert.equal(
      await page.locator("#contact-link").getAttribute("href"),
      null,
    );
    for (const email of [
      "consult@example.com",
      "bad\r\nBcc:test@example.com",
      "javascript:alert(1)",
    ]) {
      await page.route("**/web-demos/assets/config.js", (r) =>
        r.fulfill({
          contentType: "text/javascript",
          body: `window.PORTFOLIO_CONFIG={email:${JSON.stringify(email)}}`,
        }),
      );
      await page.reload();
      const href = await page.locator("#contact-link").getAttribute("href");
      if (email === "consult@example.com") {
        assert(href.startsWith("mailto:consult%40example.com"));
        assert(!href.includes("body="));
      } else assert.equal(href, null);
      await page.unroute("**/web-demos/assets/config.js");
    }
    assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
    assert.equal(await page.evaluate(() => document.cookie), "");
    const nojs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 800 },
    });
    const np = await nojs.newPage();
    await np.goto(url);
    assert(await np.locator("nav").isVisible());
    assert(await np.locator("#inquiries").isDisabled());
    assert(await np.locator("#copy").isDisabled());
    assert.equal(
      await np.locator("[data-result=missed]").first().innerText(),
      "—",
    );
    assert(await np.locator("#method").isVisible());
    assert(
      await np.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.deepEqual(external, []);
    assert.deepEqual(failures, []);
    console.log(
      "PASS axe 320/1440 valid+invalid, mobile live-result jump, safe configured/unconfigured contact, no storage, no-JS, zero external requests/console/HTTP errors",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
