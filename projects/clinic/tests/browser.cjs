/* Development-only browser QA. See ../README.md for setup; not loaded by the site. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const axePath = require.resolve("axe-core/axe.min.js");
const base =
  process.env.CLINIC_TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/clinic/";
const screenshots =
  process.env.CLINIC_SCREENSHOTS || "/tmp/clinic-qa-screenshots";
fs.mkdirSync(screenshots, { recursive: true });
const launchOptions = { headless: true };
if (process.env.CHROMIUM_PATH)
  launchOptions.executablePath = process.env.CHROMIUM_PATH;

(async () => {
  const browser = await chromium.launch(launchOptions);
  try {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    const failures = [];
    const externalRequests = [];
    page.on("pageerror", (error) => failures.push(error.message));
    page.on("response", (response) => {
      if (response.status() >= 400)
        failures.push(`${response.status()} ${response.url()}`);
    });
    page.on("request", (request) => {
      if (new URL(request.url()).origin !== new URL(base).origin)
        externalRequests.push(request.url());
    });
    await page.goto(base);
    assert.equal(await page.locator("html").getAttribute("lang"), "en");
    const parity = await page.evaluate(() => {
      const entries = Object.values(window.CLINIC_TRANSLATIONS).map(
        (dictionary) => Object.keys(dictionary).sort(),
      );
      return entries.every(
        (keys) => JSON.stringify(keys) === JSON.stringify(entries[0]),
      );
    });
    assert(parity, "translation dictionaries must have identical keys");
    for (const language of ["en", "de", "ru"]) {
      await page.locator("#language").selectOption(language);
      assert.equal(await page.locator("html").getAttribute("lang"), language);
      const untranslated = await page.evaluate(() => {
        const dict = window.CLINIC_TRANSLATIONS[document.documentElement.lang];
        const normalize = (html) => {
          const node = document.createElement("div");
          node.innerHTML = html;
          return node.textContent.replace(/\s+/g, " ").trim();
        };
        return [...document.querySelectorAll("[data-i18n]")]
          .filter(
            (node) =>
              !["dateHint"].includes(node.dataset.i18n) &&
              normalize(node.innerHTML) !== normalize(dict[node.dataset.i18n]),
          )
          .map((node) => node.dataset.i18n);
      });
      assert.deepEqual(untranslated, [], `translated content in ${language}`);
      const labels = await page.evaluate(() => {
        const dict = window.CLINIC_TRANSLATIONS[document.documentElement.lang];
        return (
          [...document.querySelectorAll("[data-aria]")].every(
            (node) =>
              node.getAttribute("aria-label") === dict[node.dataset.aria],
          ) &&
          [...document.querySelectorAll("[data-placeholder]")].every(
            (node) => node.placeholder === dict[node.dataset.placeholder],
          )
        );
      });
      assert(
        labels,
        `localized accessibility labels and placeholders in ${language}`,
      );
      for (const width of [320, 390, 600, 601, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 960 });
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${language}: overflow at ${width}`,
        );
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.screenshot({
        path: path.join(screenshots, `${language}-mobile.png`),
        fullPage: true,
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.screenshot({
        path: path.join(screenshots, `${language}-desktop.png`),
        fullPage: true,
      });
      console.log(
        `PASS ${language}: translations, labels, eight responsive widths, screenshots`,
      );
    }
    await page.reload();
    assert.equal(
      await page.locator("html").getAttribute("lang"),
      "ru",
      "language persisted",
    );
    assert.equal(await page.locator("#name").inputValue(), "");
    await page.locator("#language").selectOption("en");
    const brokenAnchors = await page
      .locator('a[href^="#"]')
      .evaluateAll((links) =>
        links
          .filter((link) => !document.getElementById(link.hash.slice(1)))
          .map((link) => link.hash),
      );
    assert.deepEqual(brokenAnchors, []);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#menu-toggle").click();
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "true",
    );
    await page.keyboard.press("Escape");
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "menu-toggle",
    );
    await page.locator("#menu-toggle").click();
    await page.locator('#main-nav a[href="#services"]').click();
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "services",
    );
    assert.equal(
      await page.locator("#menu-toggle").getAttribute("aria-expanded"),
      "false",
    );
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert(await page.locator("#main-nav").isVisible());
    await page.reload();
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(() => document.activeElement.className),
      "skip-link",
    );
    assert(
      await page
        .locator(".skip-link")
        .evaluate((node) => getComputedStyle(node).outlineStyle !== "none"),
    );
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "main");
    const firstFAQ = page.locator("details").first();
    await firstFAQ.locator("summary").focus();
    await page.keyboard.press("Enter");
    assert(await firstFAQ.evaluate((node) => node.open));
    await page.keyboard.press("Space");
    assert(!(await firstFAQ.evaluate((node) => node.open)));
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    console.log(
      "PASS persistence, navigation, menu/focus/Escape, skip link, keyboard FAQ, reduced motion",
    );

    for (const language of ["en", "de", "ru"]) {
      await page.locator("#language").selectOption(language);
      await page.locator(".prepare-button").click();
      assert.equal(await page.locator('[aria-invalid="true"]').count(), 6);
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "name",
      );
      const errorsMatch = await page.evaluate(() =>
        ["name", "email", "phone", "service", "date", "time"].every(
          (key) =>
            document.querySelector(`#${key}-error`).textContent ===
            window.CLINIC_TRANSLATIONS[document.documentElement.lang][
              `${key}Error`
            ],
        ),
      );
      assert(errorsMatch, `localized errors ${language}`);
    }
    await page.locator("#name").fill("Example Person");
    await page.locator("#email").fill("invalid");
    await page.locator("#phone").fill("abc");
    await page.locator(".prepare-button").click();
    assert.equal(
      await page.locator("#email").getAttribute("aria-invalid"),
      "true",
    );
    assert.equal(
      await page.locator("#phone").getAttribute("aria-invalid"),
      "true",
    );
    await page.locator("#email").fill("example@example.com");
    await page.locator("#phone").fill("+49 30 1234 5678");
    await page.locator('[data-service="dental"]').click();
    assert.equal(await page.locator("#service").inputValue(), "dental");
    await page.locator("#time").selectOption("morning");
    const range = await page
      .locator("#date")
      .evaluate((node) => ({ min: node.min, max: node.max }));
    await page.locator("#date").fill("2000-01-01");
    await page.locator(".prepare-button").click();
    assert.equal(
      await page.locator("#date").getAttribute("aria-invalid"),
      "true",
    );
    await page.locator("#date").fill("2099-01-01");
    await page.locator(".prepare-button").click();
    assert.equal(
      await page.locator("#date").getAttribute("aria-invalid"),
      "true",
    );
    await page.locator("#date").fill(range.min);
    await page
      .locator("#message")
      .fill('Example only. <script>alert("test")</script> & a question?');
    await page.locator(".prepare-button").click();
    assert(await page.locator("#inquiry-result").isVisible());
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "summary-title",
    );
    assert.equal(await page.locator('[aria-invalid="true"]').count(), 0);
    assert(
      (await page.locator("#inquiry-summary").inputValue()).includes(
        '<script>alert("test")</script>',
      ),
    );
    for (const language of ["en", "de", "ru"]) {
      await page.locator("#language").selectOption(language);
      assert.equal(await page.locator("#name").inputValue(), "Example Person");
      const expected = await page.evaluate(() => {
        const language = document.documentElement.lang;
        const dict = window.CLINIC_TRANSLATIONS[language];
        const text = document.querySelector("#inquiry-summary").value;
        return (
          text.includes(dict.summaryDisclaimer) &&
          text.includes(dict.serviceDental) &&
          text.includes(dict.timeMorning) &&
          text.includes(dict.name)
        );
      });
      assert(expected, `summary translated in ${language}`);
    }
    assert(await page.locator("#summary-wa-off").isVisible());
    assert.equal(await page.locator('a[href^="https://wa.me/"]').count(), 0);
    await page.locator("#copy-summary").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#copy-status").textContent ===
        window.CLINIC_TRANSLATIONS[document.documentElement.lang].copied,
    );
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      await page.locator("#inquiry-summary").inputValue(),
    );
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("Test denial");
          },
        },
      }),
    );
    await page.locator("#copy-summary").click();
    await page.waitForFunction(
      () => document.activeElement.id === "inquiry-summary",
    );
    assert(
      await page
        .locator("#inquiry-summary")
        .evaluate(
          (node) =>
            node.selectionEnd - node.selectionStart === node.value.length,
        ),
    );
    const copyFailure = await page.evaluate(
      () =>
        document.querySelector("#copy-status").textContent ===
        window.CLINIC_TRANSLATIONS[document.documentElement.lang].copyFailed,
    );
    assert(copyFailure);
    await page.locator("#message").fill("Changed preferences");
    assert(
      await page.locator("#inquiry-result").isHidden(),
      "editing hides stale inquiry",
    );
    await page.locator("#date").fill(range.max);
    await page.locator(".prepare-button").click();
    assert(
      await page.locator("#inquiry-result").isVisible(),
      "90-day boundary accepted",
    );
    console.log(
      "PASS localized validation, date boundaries, service selection, safe summary, language-preserved data, actual clipboard copy and denied-copy fallback",
    );

    // Isolated browser contexts mock destination configuration; never navigate to WhatsApp.
    for (const number of ["15555550123", "invalid", ""]) {
      const configContext = await browser.newContext();
      const configPage = await configContext.newPage();
      await configPage.route("**/assets/config.js", (route) =>
        route.fulfill({
          contentType: "application/javascript",
          body: `window.CLINIC_CONFIG={whatsappNumber:${JSON.stringify(number)}};`,
        }),
      );
      await configPage.goto(base);
      if (number === "15555550123") {
        const contact = new URL(
          await configPage.locator("#contact-whatsapp").getAttribute("href"),
        );
        assert.equal(contact.hostname, "wa.me");
        assert.equal(contact.pathname, `/${number}`);
        await configPage.locator("#name").fill("Example Person");
        await configPage.locator("#email").fill("example@example.com");
        await configPage.locator("#phone").fill("+49 30 1234 5678");
        await configPage.locator("#service").selectOption("general");
        await configPage.locator("#date").fill(range.min);
        await configPage.locator("#time").selectOption("midday");
        await configPage.locator("#message").fill("A & B? Пример + Beispiel");
        await configPage.locator(".prepare-button").click();
        const url = new URL(
          await configPage.locator("#summary-whatsapp").getAttribute("href"),
        );
        assert.equal(
          url.searchParams.get("text"),
          await configPage.locator("#inquiry-summary").inputValue(),
        );
        assert.equal(
          await configPage.locator("#summary-whatsapp").getAttribute("rel"),
          "noopener noreferrer",
        );
      } else {
        assert.equal(
          await configPage.locator('a[href^="https://wa.me/"]').count(),
          0,
        );
        assert(await configPage.locator("#contact-wa-off").isVisible());
      }
      await configContext.close();
    }
    const blockedContext = await browser.newContext();
    const blockedPage = await blockedContext.newPage();
    await blockedPage.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("Test storage denial");
        },
      });
    });
    await blockedPage.goto(base);
    await blockedPage.locator("#language").selectOption("de");
    assert.equal(await blockedPage.locator("html").getAttribute("lang"), "de");
    await blockedContext.close();
    const nojsContext = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 800 },
    });
    const nojsPage = await nojsContext.newPage();
    await nojsPage.goto(base);
    assert(await nojsPage.locator("#main-nav").isVisible());
    assert(await nojsPage.locator(".prepare-button").isDisabled());
    await nojsPage.locator("summary").first().click();
    assert(
      await nojsPage
        .locator("details")
        .first()
        .evaluate((node) => node.open),
    );
    await nojsContext.close();
    console.log(
      "PASS WhatsApp configured/unconfigured/invalid, encoding, blocked storage, no-JavaScript fallback",
    );
    for (const language of ["en", "de", "ru"]) {
      await page.locator("#language").selectOption(language);
      for (const width of [320, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.addScriptTag({ path: axePath });
        const results = await page.evaluate(() =>
          axe.run(document, {
            runOnly: {
              type: "tag",
              values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
            },
          }),
        );
        assert.deepEqual(
          results.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => ({
              html: n.html,
              reason: n.failureSummary,
            })),
          })),
          [],
          `${language} axe at ${width}`,
        );
      }
    }
    console.log(
      "PASS axe WCAG A/AA: EN/DE/RU at 320px and 1440px, including generated inquiry",
    );
    assert.deepEqual(externalRequests, []);
    assert.deepEqual(failures, []);
    console.log(
      "PASS no external runtime requests, failed HTTP responses, or browser exceptions",
    );
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
