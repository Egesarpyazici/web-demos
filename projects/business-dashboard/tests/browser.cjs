/* Development-only Playwright + axe-core; no runtime dependencies. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const D = require("../assets/mock-data.js");
const A = require("../assets/analytics.js");
const S = require("../assets/store.js");
const url =
  process.env.ORDELLE_TEST_URL ||
  "http://127.0.0.1:8000/web-demos/projects/business-dashboard/";
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();
    const errors = [],
      external = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("response", (r) => {
      if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
    });
    page.on("request", (r) => {
      if (new URL(r.url()).origin !== new URL(url).origin)
        external.push(r.url());
    });
    const go = async (view) => {
      await page.evaluate((v) => (location.hash = v), view);
      await page.waitForFunction(
        (v) => document.querySelector("#view-" + v).hidden === false,
        view,
      );
    };
    const ids = async (kind) =>
      page
        .locator(`#${kind}-table [data-record]`)
        .evaluateAll((es) => es.map((e) => e.dataset.record));
    const base = D.generate();
    fs.mkdirSync("/tmp/ordelle-qa", { recursive: true });
    for (const width of [320, 390, 600, 768, 950, 1024, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      for (const view of [
        "overview",
        "orders",
        "inquiries",
        "analytics",
        "settings",
      ]) {
        await go(view);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${width} ${view}: page overflow`,
        );
        assert.equal(await page.locator("h1").count(), 1);
        if ([320, 390, 1440].includes(width)) {
          await page.addScriptTag({
            path: require.resolve("axe-core/axe.min.js"),
          });
          const results = await page.evaluate(() =>
            axe.run(document, {
              runOnly: {
                type: "tag",
                values: ["wcag2a", "wcag2aa", "wcag21aa", "best-practice"],
              },
            }),
          );
          assert.deepEqual(
            results.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            [],
            `axe ${width} ${view}`,
          );
        }
        if (
          [390, 1440].includes(width) &&
          ["overview", "orders", "analytics"].includes(view)
        )
          await page.screenshot({
            path: `/tmp/ordelle-qa/${width}-${view}.png`,
            fullPage: true,
          });
      }
    }
    console.log(
      "PASS responsive 320–1920, all five views; axe at 320/390/1440",
    );
    await page.setViewportSize({ width: 1440, height: 900 });
    await go("overview");
    for (const period of [7, 30, 90]) {
      await page.selectOption("#period", String(period));
      const m = A.metrics(base, period);
      assert.deepEqual(await page.locator(".metric-value").allTextContents(), [
        A.money(m.revenue),
        String(m.orders),
        String(m.pending),
        String(m.open),
      ]);
      assert(
        (await page.locator(".overview-summary").innerText()).includes(
          A.money(m.average),
        ),
      );
    }
    await go("orders");
    assert.deepEqual(
      await ids("orders"),
      A.query(base, "orders", { period: 90 })
        .slice(0, 10)
        .map((r) => r.id),
    );
    await page.getByRole("button", { name: "Next", exact: true }).click();
    assert.deepEqual(
      await ids("orders"),
      A.query(base, "orders", { period: 90 })
        .slice(10, 20)
        .map((r) => r.id),
    );
    await page.getByRole("button", { name: "Previous", exact: true }).click();
    assert.equal(
      await page.evaluate(() => document.activeElement.textContent),
      "Next",
    );
    await page.fill("#orders-search", "aster");
    await page.selectOption("#orders-status", "completed");
    await page.selectOption("#orders-payment", "paid");
    const filtered = A.query(base, "orders", {
      period: 90,
      search: "aster",
      status: "completed",
      payment: "paid",
    });
    assert(filtered.length);
    assert.deepEqual(
      await ids("orders"),
      filtered.slice(0, 10).map((r) => r.id),
    );
    const downloadPromise = page.waitForEvent("download");
    await page.click("#export-orders");
    const download = await downloadPromise;
    const csv = fs
      .readFileSync(await download.path(), "utf8")
      .replace(/^\uFEFF/, "");
    assert.equal(csv, A.exportCSV(filtered));
    await page.fill("#orders-search", "NO MATCH");
    assert(
      (await page.locator("#orders-table").innerText()).includes(
        "No matching records",
      ),
    );
    assert.equal((await ids("orders")).length, 0);
    await page.click('[data-clear="orders"]');
    for (const sort of ["date", "amount", "customer"])
      for (const direction of ["asc", "desc"]) {
        await page.selectOption("#orders-sort", sort);
        await page.selectOption("#orders-direction", direction);
        assert.deepEqual(
          await ids("orders"),
          A.query(base, "orders", { period: 90, sort, direction })
            .slice(0, 10)
            .map((r) => r.id),
        );
      }
    const order = base.orders.find(
      (r) => r.payment === "paid" && r.fulfillment !== "cancelled",
    );
    await page.fill("#orders-search", order.id);
    await page.locator("#orders-table [data-record]").click();
    assert(await page.locator("#record-dialog").isVisible());
    await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
    assert.deepEqual(
      (await page.evaluate(() => axe.run(document))).violations.map(
        (v) => v.id,
      ),
      [],
    );
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      assert(
        await page.evaluate(() =>
          document
            .querySelector("#record-dialog")
            .contains(document.activeElement),
        ),
      );
    }
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.record),
      order.id,
    );
    await page.locator("#orders-table [data-record]").click();
    await page.selectOption("#edit-fulfillment", "cancelled");
    await page.locator('#record-form button[type="submit"]').click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector("#record-dialog")
          .contains(document.activeElement),
    );
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.record),
      order.id,
    );
    assert(
      (await page.locator("#orders-table").innerText()).includes("Cancelled"),
    );
    await go("overview");
    assert.equal(
      await page.locator(".metric-value").first().innerText(),
      A.money(A.metrics(base, 90).revenue - order.amountCents),
    );
    await page.click("#undo");
    assert.equal(
      await page.locator(".metric-value").first().innerText(),
      A.money(A.metrics(base, 90).revenue),
    );
    await go("orders");
    await page.locator("#orders-table [data-record]").click();
    await page.selectOption("#edit-fulfillment", "cancelled");
    await page.locator('#record-form button[type="submit"]').click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector("#record-dialog")
          .contains(document.activeElement),
    );
    await page.reload();
    assert((await page.locator("#orders-table").innerText()).length);
    assert.equal(
      await page.evaluate(
        (id) =>
          JSON.parse(localStorage.getItem("ordelle.demo.v1")).orders[id]
            .fulfillment,
        order.id,
      ),
      "cancelled",
    );
    for (const payment of ["pending", "refunded"]) {
      const o = base.orders.find((r) => r.payment === payment);
      await page.fill("#orders-search", o.id);
      await page.locator("#orders-table [data-record]").click();
      assert.deepEqual(
        await page
          .locator("#edit-fulfillment option")
          .evaluateAll((es) => es.map((e) => e.value)),
        D.allowedFulfillment(o),
      );
      await page.keyboard.press("Escape");
    }
    await go("inquiries");
    const inquiry = base.inquiries.find((r) => r.status !== "resolved");
    await page.fill("#inquiries-search", inquiry.id);
    await page.selectOption("#inquiries-status", inquiry.status);
    await page.selectOption("#inquiries-channel", inquiry.channel);
    await page.selectOption("#inquiries-priority", inquiry.priority);
    assert.deepEqual(await ids("inquiries"), [inquiry.id]);
    await page.locator("#inquiries-table [data-record]").click();
    await page.selectOption("#edit-status", "resolved");
    await page.selectOption("#edit-priority", "high");
    await page.locator('#record-form button[type="submit"]').click();
    await page.waitForFunction(
      () =>
        !document
          .querySelector("#record-dialog")
          .contains(document.activeElement),
    );
    assert.deepEqual(await ids("inquiries"), []);
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "view-heading",
    );
    await page.click('[data-clear="inquiries"]');
    for (const sort of ["date", "customer", "priority", "status"])
      for (const direction of ["asc", "desc"]) {
        await page.selectOption("#inquiries-sort", sort);
        await page.selectOption("#inquiries-direction", direction);
        const records = {
          ...base,
          inquiries: base.inquiries.map((r) =>
            r.id === inquiry.id
              ? { ...r, status: "resolved", priority: "high" }
              : r,
          ),
        };
        assert.deepEqual(
          await ids("inquiries"),
          A.query(records, "inquiries", { period: 90, sort, direction })
            .slice(0, 10)
            .map((r) => r.id),
        );
      }
    await go("overview");
    assert.equal(
      await page.locator(".metric-value").nth(3).innerText(),
      String(A.metrics(base, 90).open - 1),
    );
    await go("analytics");
    await page.goBack();
    await page.waitForSelector("#view-overview:not([hidden])");
    await go("orders");
    await page.locator(".skip").focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.evaluate(() => document.activeElement.id), "main");
    assert(await page.locator("#view-orders").isVisible());
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click("#menu");
    assert(await page.locator("#nav-dialog").isVisible());
    await page.keyboard.press("Escape");
    assert.equal(await page.evaluate(() => document.activeElement.id), "menu");
    await page.click("#menu");
    await page.locator('#nav-dialog a[href="#analytics"]').click();
    await page.waitForSelector("#view-analytics:not([hidden])");
    assert(!(await page.locator("#nav-dialog").isVisible()));
    await page.click("#menu");
    await page.setViewportSize({ width: 1440, height: 900 });
    assert(!(await page.locator("#nav-dialog").isVisible()));
    await go("settings");
    await page.evaluate(() => localStorage.setItem("other-demo", "preserve"));
    await page.click("#reset-demo");
    await page.keyboard.press("Escape");
    assert.equal(
      await page.evaluate(() => document.activeElement.id),
      "reset-demo",
    );
    assert(
      await page.evaluate(() => !!localStorage.getItem("ordelle.demo.v1")),
    );
    await page.click("#reset-demo");
    await page.click("#confirm-reset");
    assert.equal(await page.inputValue("#period"), "30");
    assert.equal(
      await page.evaluate(() => localStorage.getItem("ordelle.demo.v1")),
      null,
    );
    assert.equal(
      await page.evaluate(() => localStorage.getItem("other-demo")),
      "preserve",
    );
    await go("overview");
    assert.equal(
      await page.locator(".metric-value").first().innerText(),
      A.money(A.metrics(base, 30).revenue),
    );
    await page.evaluate(() =>
      localStorage.setItem("ordelle.demo.v1", "bad json"),
    );
    await page.reload();
    assert(await page.locator("#storage-warning").isVisible());
    assert.equal(
      await page.locator(".metric-value").first().innerText(),
      A.money(A.metrics(base, 30).revenue),
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    console.log(
      "PASS search, combined filters, sorting, pagination, CSV download, edits/undo, revenue, inquiry counts, persistence, reset, corruption, keyboard/dialogs/history/mobile menu",
    );
    // Zero revenue is a valid state, with finite geometry and exact table alternatives.
    await page.evaluate(() => {
      const s = OrdelleStore.create(localStorage);
      for (const o of s.records().orders.filter((o) => o.payment === "paid"))
        s.edit("orders", o.id, { fulfillment: "cancelled" });
    });
    await page.reload();
    assert.equal(
      await page.locator(".metric-value").first().innerText(),
      "$0.00",
    );
    assert(
      !(await page.locator("#overview-content").innerHTML()).match(
        /NaN|Infinity/,
      ),
    );
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Blocked", "SecurityError");
        },
      });
    });
    const bp = await blocked.newPage();
    await bp.goto(url + "#inquiries");
    await bp.locator("#inquiries-table [data-record]").first().click();
    await bp.selectOption("#edit-status", "resolved");
    await bp.locator('#record-form button[type="submit"]').click();
    assert(
      (await bp.locator("#save-state").innerText()).includes("Session-only"),
    );
    await blocked.close();
    const nojs = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 320, height: 800 },
    });
    const np = await nojs.newPage();
    await np.goto(url);
    assert(await np.locator(".nojs").isVisible());
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
    assert.deepEqual(errors, []);
    assert.deepEqual(external, []);
    console.log(
      "PASS zero revenue, blocked storage, reduced motion, no-JS fallback, relative paths, no external requests or browser errors",
    );
    await context.close();
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
