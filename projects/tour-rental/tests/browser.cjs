const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const url =
  process.env.TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/tour-rental/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await browser.newContext({
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage(),
    errors = [],
    externalRequests = [];
  page.on("request", (r) => {
    if (new URL(r.url()).origin !== new URL(url).origin)
      externalRequests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  fs.mkdirSync("/tmp/orivela-qa", { recursive: true });
  for (const width of [320, 390, 600, 601, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(url);
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    );
    assert.equal(await page.locator("h1").count(), 1);
    const hero = await page.evaluate(() => {
      const image = document.querySelector(".hero-art");
      const heading = document.querySelector("h1").getBoundingClientRect();
      const action = document
        .querySelector(".hero-actions .button")
        .getBoundingClientRect();
      const header = document.querySelector(".header").getBoundingClientRect();
      return {
        source: image.currentSrc,
        headingVisible:
          heading.top >= header.bottom && heading.right <= innerWidth,
        actionVisible:
          action.bottom < innerHeight &&
          action.left >= 0 &&
          action.right <= innerWidth,
      };
    });
    assert(
      hero.source.includes(
        width <= 600 ? "yacht-night-mobile.webp" : "yacht-night",
      ),
      `art-directed hero source at ${width}`,
    );
    assert(
      hero.headingVisible && hero.actionVisible,
      `hero headline/CTA visible at ${width}`,
    );

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
    for (const img of await page.locator("img").all()) {
      await img.evaluate((e) => (e.loading = "eager"));
    }
    await page.waitForFunction(() =>
      [...document.images].every((e) => e.complete && e.naturalWidth),
    );
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `/tmp/orivela-qa/${width}.png`,
        fullPage: true,
      });
    console.log(`PASS layout, anchors, artwork ${width}px`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.locator("#menu").click();
  assert.equal(
    await page.locator("#menu").getAttribute("aria-expanded"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.equal(await page.evaluate(() => document.activeElement.id), "menu");
  await page.locator("#menu").click();
  await page.locator("#navigation a").first().click();
  assert.equal(
    await page.locator("#menu").getAttribute("aria-expanded"),
    "false",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "experiences",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  assert(await page.locator("#navigation").isVisible());
  await page.goto(url);
  await page.keyboard.press("Tab");
  assert.equal(
    await page
      .locator(".skip")
      .evaluate((e) => getComputedStyle(e).outlineStyle),
    "solid",
  );
  await page.keyboard.press("Enter");
  assert.equal(await page.evaluate(() => document.activeElement.id), "main");
  await page.locator("#gallery-view").focus();
  await page.keyboard.press("End");
  assert.equal(
    await page.locator('[data-slide="2"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(
    await page.locator('[data-slide="0"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#previous").click();
  assert.equal(
    await page.locator('[data-slide="2"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator('[data-slide="1"]').click();
  await page.locator("#next").click();
  assert.equal(
    await page.locator('[data-slide="2"]').getAttribute("aria-pressed"),
    "true",
  );
  await page.locator("#questions summary").first().click();
  assert(
    await page
      .locator("#questions details")
      .first()
      .evaluate((e) => e.open),
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  console.log(
    "PASS menu, focus, skip link, gallery keyboard/buttons, FAQ, reduced motion",
  );
  const dates = await page.evaluate(() => {
    const e = OrivelaPricing,
      t = e.localToday();
    return [e.offsetDay(t, 1), e.offsetDay(t, 3), e.offsetDay(t, 8)];
  });
  await page.locator("#start").fill(dates[0]);
  await page.locator("#end").fill(dates[1]);
  await page.locator("#guests").fill("8");
  await page.locator("#option").selectOption("coves");
  for (const k of ["host", "tasting", "paddle", "transfer"])
    await page.locator("#extra-" + k).check();
  assert.equal(await page.locator("#total").innerText(), "€6,940.00");
  await page.locator("#end").fill(dates[2]);
  assert.equal(await page.locator("#total").innerText(), "—");
  assert.equal(await page.locator("#end").getAttribute("aria-invalid"), "true");
  await page.locator("#end").fill(dates[1]);
  await page.locator("#guests").fill("11");
  assert.equal(await page.locator("#total").innerText(), "—");
  await page.locator("#guests").fill("8");
  await page.locator("#start").fill("");
  assert.equal(await page.locator("#total").innerText(), "—");
  await page.locator("#start").fill(dates[0]);
  await page.locator("#inquiry-form button[type=submit]").click();
  assert.equal(await page.evaluate(() => document.activeElement.id), "name");
  assert.equal(await page.locator("#result").isVisible(), false);
  await page.locator("#name").fill("Alex Example");
  await page.locator("#email").fill("bad");
  await page.locator("#phone").fill("abc");
  await page.locator("#inquiry-form button[type=submit]").click();
  assert.equal(
    await page.locator("#email").getAttribute("aria-invalid"),
    "true",
  );
  assert.equal(
    await page.locator("#phone").getAttribute("aria-invalid"),
    "true",
  );
  await page.locator("#email").fill("alex@example.com");
  await page.locator("#phone").fill("+44 7700 900123");
  await page
    .locator("#message")
    .fill("<img src=x onerror=alert(1)> A quiet day, please.");
  await page.locator("#inquiry-form button[type=submit]").click();
  const summary = await page.locator("#summary").inputValue();
  assert(summary.includes("€6,940.00"));
  assert(summary.includes("Billable days: 3"));
  assert(summary.includes("<img src=x"));
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    "result-title",
  );
  assert.equal(await page.locator("#summary-whatsapp").isVisible(), false);
  assert.equal(
    await page.locator("#contact-whatsapp").getAttribute("href"),
    null,
  );
  await page.locator("#copy").click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    summary,
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("Denied");
        },
      },
    }),
  );
  await page.locator("#copy").click();
  assert((await page.locator("#copy-status").innerText()).includes("selected"));
  assert.equal(
    await page
      .locator("#summary")
      .evaluate((e) => e.selectionEnd - e.selectionStart),
    summary.length,
  );
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    const violations = await page.evaluate(async () =>
      (await axe.run()).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
    );
    assert.deepEqual(
      violations,
      [],
      `axe ${width}: ${JSON.stringify(violations)}`,
    );
  }
  await page.locator("#guests").fill("7");
  assert.equal(await page.locator("#result").isVisible(), false);
  assert.equal(await page.locator("#summary").inputValue(), "");
  console.log(
    "PASS live itemized pricing, invalid inputs, inquiry validation, safe summary, real clipboard/fallback, axe 320/1440",
  );
  await page.locator("#package").selectOption("sunset");
  assert.equal(await page.locator("#option").inputValue(), "classic");
  await page.locator("#guests").fill("9");
  assert.equal(await page.locator("#total").innerText(), "—");
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  assert.deepEqual(
    await page.evaluate(async () =>
      (await axe.run()).violations.map((v) => v.id),
    ),
    [],
  );
  await page.locator('[data-choose="signature"]').click();
  assert.equal(await page.locator("#package").inputValue(), "signature");
  assert.equal(await page.locator("#option").inputValue(), "motor");
  assert.equal(
    await page.locator("#guests").getAttribute("aria-invalid"),
    "false",
  );
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage)), []);
  assert.deepEqual(externalRequests, []);
  console.log(
    "PASS package-switch limits, package CTA, invalid-state accessibility, visible focus, no storage/external requests",
  );
  const configSource = fs.readFileSync(
    require.resolve("../assets/config.js"),
    "utf8",
  );
  for (const number of ["447700900123", "+44 unsafe"]) {
    await page.route("**/tour-rental/assets/config.js", (r) =>
      r.fulfill({
        contentType: "text/javascript",
        body:
          configSource +
          `\nwindow.ORIVELA_CONFIG.whatsappNumber=${JSON.stringify(number)};`,
      }),
    );
    await page.reload();
    if (number.startsWith("+")) {
      assert.equal(
        await page.locator("#contact-whatsapp").getAttribute("href"),
        null,
      );
    } else {
      assert(
        (
          await page.locator("#contact-whatsapp").getAttribute("href")
        ).startsWith("https://wa.me/447700900123?text="),
      );
      await page.locator("#name").fill("Alex Example");
      await page.locator("#email").fill("alex@example.com");
      await page.locator("#phone").fill("+44 7700 900123");
      await page.locator("#inquiry-form button[type=submit]").click();
      const href = await page.locator("#summary-whatsapp").getAttribute("href");
      assert.equal(
        new URL(href).searchParams.get("text"),
        await page.locator("#summary").inputValue(),
      );
      await page.locator("#name").fill("Alex Changed");
      assert.equal(
        await page.locator("#summary-whatsapp").getAttribute("href"),
        null,
      );
    }
    await page.unroute("**/tour-rental/assets/config.js");
  }
  console.log(
    "PASS configured/unconfigured/invalid WhatsApp, exact encoded summary, stale-link removal (no external sends)",
  );
  const touch = await browser.newContext({
    hasTouch: true,
    isMobile: true,
    viewport: { width: 390, height: 844 },
  });
  const tp = await touch.newPage();
  await tp.goto(url);
  await tp.locator("#gallery-view").scrollIntoViewIfNeeded();
  const box = await tp.locator("#gallery-view").boundingBox();
  const cdp = await touch.newCDPSession(tp);
  const y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: 300, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: 100, y }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  assert.equal(
    await tp.locator('[data-slide="1"]').getAttribute("aria-pressed"),
    "true",
  );
  console.log("PASS Chromium emulated touch swipe");
  const nojs = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 800 },
  });
  const np = await nojs.newPage();
  await np.goto(url);
  assert(await np.locator("#navigation").isVisible());
  assert.equal(await np.locator(".slide:visible").count(), 3);
  assert(await np.locator("#start").isDisabled());
  assert(await np.locator("#name").isDisabled());
  assert(
    await np.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  assert.deepEqual(errors, []);
  console.log("PASS no-JS fallback, zero browser exceptions/HTTP failures");
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
