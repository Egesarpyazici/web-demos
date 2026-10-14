/* Development-only Playwright/axe tests; these dependencies are never shipped. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const url =
  process.env.MARKETING_GAME_TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/marketing-game/";
const source = fs.readFileSync(
  path.join(__dirname, "../assets/app.js"),
  "utf8",
);
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage(),
      errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on("request", (r) => {
      if (new URL(r.url()).origin !== new URL(url).origin)
        external.push(r.url());
    });
    fs.mkdirSync("/tmp/velune-qa", { recursive: true });
    const card = (p, id) => p.locator(`[data-card="${id}"]`);
    const phase = async (value) =>
      page.waitForFunction(
        (v) => document.querySelector("#board").dataset.phase === v,
        value,
      );
    const complete = async (p) => {
      await p.evaluate(() => {
        const ids = [...document.querySelectorAll(".card")]
          .map((e) => e.dataset.card)
          .sort();
        for (const id of ids)
          document.querySelector(`[data-card="${id}"]`).click();
      });
      await p.waitForSelector("#reward:not([hidden])");
    };
    const axe = async (p) => {
      await p.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
      const results = await p.evaluate(() =>
        axe.run(document, {
          runOnly: {
            type: "tag",
            values: [
              "wcag2a",
              "wcag2aa",
              "wcag21aa",
              "wcag22aa",
              "best-practice",
            ],
          },
        }),
      );
      assert.deepEqual(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
    };
    for (const width of [320, 375, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      assert.equal(await page.locator(".card").count(), 16);
      assert.equal(await page.locator(".is-revealed").count(), 0);
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${width}`,
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
      assert(
        await page.locator(".card").evaluateAll((es) =>
          es.every((e) => {
            const r = e.getBoundingClientRect();
            return r.width >= 44 && r.height >= 44;
          }),
        ),
        `touch targets ${width}`,
      );
      if ([320, 390, 1440].includes(width)) await axe(page);
      if ([390, 1440].includes(width)) {
        await page.screenshot({ path: `/tmp/velune-qa/${width}-viewport.png` });
        await page.screenshot({
          path: `/tmp/velune-qa/${width}-campaign.png`,
          fullPage: true,
        });
      }
      await complete(page);
      assert.equal(await page.locator("#moves").innerText(), "8");
      assert.equal(await page.locator("#matched").innerText(), "8");
      assert.equal(await page.locator("#remaining").innerText(), "0");
      assert.equal(
        await page.evaluate(() => document.activeElement.id),
        "reward-title",
      );
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `reward overflow ${width}`,
      );
      if ([320, 390, 1440].includes(width)) await axe(page);
      if ([390, 1440].includes(width))
        await page
          .locator("#reward")
          .screenshot({ path: `/tmp/velune-qa/${width}-reward.png` });
    }
    console.log(
      "PASS seven responsive widths, 44px card targets, all pairs/completion, reward focus, anchors, axe initial+reward at 320/390/1440",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(url);
    await card(page, "bloom-a").click();
    assert.equal(await page.locator("#moves").innerText(), "0");
    assert(
      (await card(page, "bloom-a").getAttribute("aria-label")).includes(
        "Bloom, revealed",
      ),
    );
    await card(page, "bloom-a").evaluate((e) => {
      for (let n = 0; n < 20; n++) e.click();
    });
    assert.equal(await page.locator(".is-revealed").count(), 1);
    await card(page, "orbit-a").click();
    await phase("resolving");
    assert.equal(await page.locator("#moves").innerText(), "1");
    assert.equal(await page.locator(".is-revealed").count(), 2);
    await page.locator(".card").evaluateAll((es) => {
      for (let n = 0; n < 10; n++) for (const e of es) e.click();
    });
    assert.equal(await page.locator("#moves").innerText(), "1");
    assert.equal(await page.locator(".is-revealed").count(), 2);
    await phase("ready");
    assert.equal(await page.locator(".is-revealed").count(), 0);
    assert(
      (await page.locator("#game-status").innerText()).includes(
        "did not match",
      ),
    );
    await card(page, "bloom-a").click();
    await card(page, "bloom-b").click();
    assert.equal(await page.locator("#matched").innerText(), "1");
    assert.equal(await page.locator("#moves").innerText(), "2");
    assert.equal(await page.locator(".is-matched").count(), 2);
    assert(
      (await card(page, "bloom-b").getAttribute("aria-label")).includes(
        "matched",
      ),
    );
    await card(page, "bloom-b").evaluate((e) => e.click());
    assert.equal(await page.locator("#moves").innerText(), "2");
    // Restart during the old mismatch, then reveal a fresh card. The old timeout must not touch it.
    await card(page, "orbit-a").click();
    await card(page, "ripple-a").click();
    await phase("resolving");
    await page.click("#restart");
    assert.equal(await page.locator("#moves").innerText(), "0");
    assert.equal(await page.locator(".is-revealed").count(), 0);
    assert(
      await page.evaluate(() =>
        document.activeElement.classList.contains("card"),
      ),
    );
    await card(page, "spark-a").click();
    await page.waitForTimeout(1150);
    await phase("first");
    assert.equal(await page.locator(".is-revealed").count(), 1);
    assert.equal(await page.locator("#moves").innerText(), "0");
    await page.click("#restart");
    await complete(page);
    await page.click("#copy-code");
    await page.waitForFunction(() =>
      document.querySelector("#copy-status").textContent.includes("copied"),
    );
    assert.equal(
      await page.evaluate(() => navigator.clipboard.readText()),
      "VELUNE-DEMO",
    );
    await page.click("#play-again");
    assert(!(await page.locator("#reward").isVisible()));
    assert.equal(await page.locator("#moves").innerText(), "0");
    assert.equal(await page.locator("#progress").getAttribute("value"), "0");
    assert(
      await page.evaluate(() =>
        document.activeElement.classList.contains("card"),
      ),
    );
    console.log(
      "PASS first/second selections, duplicate/rapid input, mismatch locking, match counts, restart during timeout, actual clipboard, replay reset",
    );
    // Complete a new game using only Tab, arrow keys, Enter and Space.
    await page.goto(url);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (let n = 0; n < 12; n++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => document.activeElement.id === "play-link"))
        break;
    }
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "play-link",
    );
    await page.keyboard.press("Enter");
    assert(
      await page.evaluate(() =>
        document.activeElement.classList.contains("card"),
      ),
    );
    const order = await page
      .locator(".card")
      .evaluateAll((es) => es.map((e) => e.dataset.card));
    for (const [n, id] of [...order].sort().entries()) {
      await page.keyboard.press("Home");
      for (let i = 0; i < order.indexOf(id); i++)
        await page.keyboard.press("ArrowRight");
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.card),
        id,
      );
      await page.keyboard.press(n % 2 ? "Space" : "Enter");
    }
    assert(await page.locator("#reward").isVisible());
    assert.equal(await page.locator("#moves").innerText(), "8");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "reward-title",
    );
    assert.equal(
      await page
        .locator(".card-turn")
        .first()
        .evaluate((e) => getComputedStyle(e).transitionDuration),
      "0s",
    );
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    // Denied clipboard offers a selected, labeled manual copy field; never claims success.
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: () => Promise.reject(new Error("Denied")) },
      }),
    );
    await page.click("#copy-code");
    await page.waitForSelector("#manual-copy:not([hidden])");
    assert.equal(await page.inputValue("#copy-field"), "VELUNE-DEMO");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "copy-field",
    );
    assert.equal(
      await page
        .locator("#copy-field")
        .evaluate((e) => e.selectionEnd - e.selectionStart),
      "VELUNE-DEMO".length,
    );
    assert(
      !(await page.locator("#copy-status").innerText()).includes("copied"),
    );
    await axe(page);
    // A slow clipboard promise from a previous completed game cannot alter a restarted game.
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () =>
            new Promise((resolve) => (window.finishCopy = resolve)),
        },
      }),
    );
    await page.click("#copy-code");
    await page.click("#play-again");
    await page.evaluate(() => window.finishCopy());
    assert.equal(await page.locator("#copy-status").innerText(), "");
    assert(!(await page.locator("#reward").isVisible()));
    // Simulate lifecycle events to check a cancelled mismatch is unlocked on BFCache restoration.
    await card(page, "bloom-a").click();
    await card(page, "orbit-a").click();
    await phase("resolving");
    await page.evaluate(() => {
      dispatchEvent(new PageTransitionEvent("pagehide"));
      dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
    });
    await phase("ready");
    assert.equal(await page.locator(".is-revealed").count(), 0);
    console.log(
      "PASS keyboard-only completion, focus, reduced motion, denied clipboard fallback, late-promise isolation, BFCache recovery",
    );
    // Rebrand by changing only the object at the top of app.js.
    const rebrand = {
      brand: {
        name: "Aurel",
        logoText: "AUREL",
        tagline: "Objects for tomorrow",
        monogram: "A",
      },
      theme: {
        background: "#101820",
        surface: "#253444",
        primary: "#e3eeaa",
        accent: "#d2c3ef",
        text: "#ffffff",
        card: "#f0ebdf",
      },
      campaign: {
        title: "Find / Keep",
        firstLine: "Make space",
        secondLine: "for a",
        finalLine: "moment.",
        description: "A fictional collection, waiting to be discovered.",
      },
      game: { pairs: 4, mismatchDelayMs: 300 },
      symbols: [
        { id: "spark", label: "Prism" },
        { id: "bloom", label: "Petal" },
        { id: "fold", label: "Page" },
        { id: "orbit", label: "Moon" },
      ],
      reward: {
        headline: "Made for discovery.",
        description: "A fictional keepsake.",
        code: "AUREL-DEMO",
      },
    };
    await page.route("**/marketing-game/assets/app.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: source.replace(
          /const GAME_CONFIG = \{[\s\S]*?\n\};/,
          "const GAME_CONFIG = " + JSON.stringify(rebrand) + ";",
        ),
      }),
    );
    await page.goto(url);
    assert((await page.title()).includes("Aurel"));
    assert.equal(
      await page.locator(".brand [data-brand]").innerText(),
      "AUREL",
    );
    assert.equal(await page.locator(".card").count(), 8);
    assert.equal(await page.locator(".card-seal").first().innerText(), "A");
    assert.deepEqual(
      await page.locator("h1 [data-campaign]").allTextContents(),
      ["Make space", "for a", "moment."],
    );
    assert.equal(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--card")
          .trim(),
      ),
      "#f0ebdf",
    );
    await complete(page);
    assert.equal(
      await page.locator('[data-reward="code"]').innerText(),
      "AUREL-DEMO",
    );
    assert.equal(
      await page.locator("#reward-title").innerText(),
      "Made for discovery.",
    );
    await axe(page);
    await page.unroute("**/marketing-game/assets/app.js");
    const invalid = {
      brand: { name: "<img src=x onerror=alert(1)>", logoText: "SAFE" },
      theme: { primary: "url(https://unsafe.invalid)" },
      game: { pairs: 99, mismatchDelayMs: -1 },
      symbols: [{ id: "bad", label: "bad" }],
      reward: { code: "<b>DEMO</b>" },
    };
    await page.route("**/marketing-game/assets/app.js", (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: source.replace(
          /const GAME_CONFIG = \{[\s\S]*?\n\};/,
          "const GAME_CONFIG = " + JSON.stringify(invalid) + ";",
        ),
      }),
    );
    await page.goto(url);
    assert.equal(await page.locator(".card").count(), 16);
    assert.equal(await page.locator('[data-brand="name"] img').count(), 0);
    assert.equal(
      await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--primary")
          .trim(),
      ),
      "#dcf594",
    );
    await complete(page);
    assert.equal(
      await page.locator('[data-reward="code"]').innerText(),
      "<b>DEMO</b>",
    );
    assert.equal(await page.locator('[data-reward="code"] b').count(), 0);
    await page.unroute("**/marketing-game/assets/app.js");
    console.log(
      "PASS one-object brand/theme/card/game/reward reconfiguration, invalid-config fallback, safe text rendering",
    );
    const touch = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const tp = await touch.newPage();
    await tp.goto(url);
    await card(tp, "bloom-a").tap();
    await card(tp, "bloom-b").tap();
    assert.equal(await tp.locator("#matched").innerText(), "1");
    await touch.close();
    const nojs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 800 },
    });
    const np = await nojs.newPage();
    await np.goto(url);
    assert(await np.locator(".nojs").isVisible());
    assert(!(await np.locator("#game-shell").isVisible()));
    assert(!(await np.locator("#play-link").isVisible()));
    assert.equal(await np.locator("button:visible").count(), 0);
    assert.equal(
      await np.locator(".nojs a").getAttribute("href"),
      "../../index.html",
    );
    assert(
      await np.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await nojs.close();
    const blocked = await browser.newContext();
    await blocked.addInitScript(() =>
      Object.defineProperty(window, "localStorage", {
        get() {
          throw Error("Blocked");
        },
      }),
    );
    const bp = await blocked.newPage();
    await bp.goto(url);
    await complete(bp);
    assert.equal(await bp.locator("#matched").innerText(), "8");
    await blocked.close();
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    assert.equal(await page.evaluate(() => localStorage.length), 0);
    console.log(
      "PASS emulated touch, no-JS fallback, blocked storage, no tracking/storage, no external requests, HTTP failures or browser exceptions",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
