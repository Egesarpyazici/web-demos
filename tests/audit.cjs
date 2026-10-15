/* Cross-site release checks. Development-only Playwright + axe-core; no build. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base =
  process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:8000/web-demos/";
const published = "https://egesarpyazici.github.io/web-demos/";
const output = process.env.AUDIT_OUTPUT_DIR || "/tmp/phase6-qa/final";
const sites = [
  "",
  "clinic",
  "tour-rental",
  "missed-inquiries",
  "business-dashboard",
  "marketing-game",
];
const widths = [320, 375, 390, 430, 768, 1024, 1440, 1920];
const results = [];
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    const titles = new Set();
    for (const slug of sites) {
      const route = slug ? `projects/${slug}/` : "";
      const page = await browser.newPage();
      const errors = [],
        external = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("requestfailed", (r) => errors.push(`Failed: ${r.url()}`));
      page.on("request", (r) => {
        if (new URL(r.url()).origin !== new URL(base).origin)
          external.push(r.url());
      });
      page.on("response", (r) => {
        if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
      });
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        assert.equal((await page.goto(base + route)).status(), 200);
        assert.equal(await page.locator("html").getAttribute("lang"), "en");
        assert.equal(await page.locator("h1:visible").count(), 1);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${slug} overflow ${width}`,
        );
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute("href"),
          published + route,
        );
        assert.equal(
          await page.locator('meta[property="og:url"]').getAttribute("content"),
          published + route,
        );
        assert.equal(
          await page
            .locator('meta[property="og:title"]')
            .getAttribute("content"),
          await page.title(),
        );
        assert.equal(
          await page
            .locator('meta[property="og:description"]')
            .getAttribute("content"),
          await page
            .locator('meta[name="description"]')
            .getAttribute("content"),
        );
        if (width === 320) {
          assert(!titles.has(await page.title()));
          titles.add(await page.title());
        }
        const brokenAnchors = await page
          .locator('a[href^="#"]')
          .evaluateAll((links) =>
            links
              .filter(
                (a) =>
                  !document.getElementById(a.hash.slice(1)) &&
                  !(
                    document.querySelector(".sidebar") &&
                    [
                      "#overview",
                      "#orders",
                      "#inquiries",
                      "#analytics",
                      "#settings",
                    ].includes(a.hash)
                  ),
              )
              .map((a) => a.hash),
          );
        assert.deepEqual(brokenAnchors, []);
        assert.deepEqual(
          await page
            .locator("img")
            .evaluateAll((imgs) =>
              imgs
                .filter(
                  (i) =>
                    !i.hasAttribute("width") ||
                    !i.hasAttribute("height") ||
                    !i.hasAttribute("alt"),
                )
                .map((i) => i.outerHTML),
            ),
          [],
        );
        let passes = null;
        if ([320, 1440].includes(width)) {
          await page.addScriptTag({
            path: require.resolve("axe-core/axe.min.js"),
          });
          const axe = await page.evaluate(() =>
            window.axe.run(document, {
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
            axe.violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((n) => n.target),
            })),
            [],
            `${slug} axe ${width}`,
          );
          passes = axe.passes.length;
          const names = await page.evaluate(() =>
            window.axe.run(".brand, .project-links", {
              runOnly: {
                type: "rule",
                values: ["label-content-name-mismatch"],
              },
            }),
          );
          assert.deepEqual(
            names.violations,
            [],
            `${slug} visible names ${width}`,
          );
        }
        if ([390, 1440].includes(width)) {
          await page.screenshot({
            path: path.join(
              output,
              `${slug || "portfolio"}-${width}-viewport.png`,
            ),
            animations: "disabled",
          });
          // Trigger actual lazy loading before full-page capture; hidden gallery/reward art is tested by its own suite.
          await page.locator("img:visible").evaluateAll(async (imgs) => {
            for (const img of imgs) {
              img.loading = "eager";
              if (img.src) await img.decode();
            }
          });
          await page.screenshot({
            path: path.join(output, `${slug || "portfolio"}-${width}-full.png`),
            animations: "disabled",
            fullPage: true,
          });
        }
        results.push({
          site: slug || "portfolio",
          width,
          overflow: false,
          axePasses: passes,
        });
      }
      // Short landscape viewport and 200% desktop zoom equivalent (CSS viewport halved).
      for (const size of [
        { width: 844, height: 390 },
        { width: 720, height: 450 },
      ]) {
        await page.setViewportSize(size);
        await page.reload();
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${slug} landscape/reflow`,
        );
      }
      // All local navigation, styles, scripts, favicon and image sources resolve independently of routing.
      const local = await page
        .locator("a[href],link[href],script[src],img[src],source[srcset]")
        .evaluateAll((nodes) => [
          ...new Set(
            nodes
              .flatMap((n) => {
                if (n.hasAttribute("srcset"))
                  return n
                    .getAttribute("srcset")
                    .split(",")
                    .map(
                      (s) =>
                        new URL(s.trim().split(/\s+/)[0], document.baseURI)
                          .href,
                    );
                return [n.href || n.src];
              })
              .filter(Boolean),
          ),
        ]);
      for (const url of local)
        if (new URL(url).origin === new URL(base).origin) {
          const response = await page.request.get(url);
          assert(response.ok(), url);
        }
      if (slug) {
        assert(
          (await page
            .locator(`a[href="../../index.html"],a[href="../../"]`)
            .count()) > 0,
        );
      }
      if (slug === "business-dashboard") {
        for (const view of [
          "orders",
          "inquiries",
          "analytics",
          "settings",
          "overview",
        ]) {
          await page.evaluate((value) => {
            location.hash = value;
          }, view);
          await page.waitForFunction(
            (value) => document.title.toLowerCase().startsWith(value),
            view,
          );
          assert.equal(
            await page
              .locator('meta[property="og:title"]')
              .getAttribute("content"),
            await page.title(),
          );
        }
      }
      if (slug === "clinic") {
        for (const lang of ["de", "ru", "en"]) {
          await page.locator("#language").selectOption(lang);
          await page.addScriptTag({
            path: require.resolve("axe-core/axe.min.js"),
          });
          const labelAudit = await page.evaluate(() =>
            window.axe.run(".brand", {
              runOnly: {
                type: "rule",
                values: ["label-content-name-mismatch"],
              },
            }),
          );
          assert.deepEqual(
            labelAudit.violations,
            [],
            `Clinic ${lang} visible brand name`,
          );
          assert.equal(
            await page
              .locator('meta[property="og:title"]')
              .getAttribute("content"),
            await page.title(),
          );
        }
      }
      assert.deepEqual(errors, []);
      assert.deepEqual(external, []);
      console.log(
        `PASS ${slug || "portfolio"}: eight widths, landscape/reflow, metadata, landmarks/axe, local resources, no browser/network errors`,
      );
      await page.close();
    }
    const home = await browser.newPage();
    await home.goto(base);
    for (const [i, slug] of sites.slice(1).entries()) {
      const card = home.locator(".project").nth(i);
      assert.match(await card.innerText(), /Live Demo — Concept/);
      assert.equal(
        await card.locator(".project-links a").nth(0).getAttribute("href"),
        `projects/${slug}/`,
      );
      assert.equal(
        await card.locator(".project-links a").nth(1).getAttribute("href"),
        `https://github.com/Egesarpyazici/web-demos/tree/main/projects/${slug}`,
      );
    }
    assert(!/coming soon/i.test(await home.locator("#work").innerText()));
    const sitemap = await home.request.get(new URL("sitemap.xml", base).href);
    assert(sitemap.ok());
    const xml = await sitemap.text();
    for (const slug of sites)
      assert(xml.includes(published + (slug ? `projects/${slug}/` : "")));
    // Contact safety: missing email stays inert, configured URLs remain local DOM changes, no delivery claims.
    for (const email of [
      "",
      "bad-address",
      "x@example.com\r\nBcc:other@example.com",
      "javascript:alert(1)",
    ]) {
      await home.route("**/assets/config.js", (r) =>
        r.fulfill({
          contentType: "text/javascript",
          body: `window.PORTFOLIO_CONFIG=${JSON.stringify({ email, github: "https://user:password@github.com/example", linkedin: "javascript:alert(1)" })}`,
        }),
      );
      await home.reload();
      assert.equal(await home.locator('a[href^="mailto:"]').count(), 0);
      assert.equal(await home.locator("#social-links a").count(), 0);
      await home.unroute("**/assets/config.js");
    }
    console.log(
      "PASS live/source link mappings, completed labels, sitemap, invalid contact/header/credential/scheme rejection",
    );
  } finally {
    fs.writeFileSync(
      path.join(output, "results.json"),
      JSON.stringify(results, null, 2),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
