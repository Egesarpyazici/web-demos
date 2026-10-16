/* Visual evidence and geometry guardrails; screenshots still require human review. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const base =
  process.env.PORTFOLIO_TEST_URL || "http://127.0.0.1:8000/web-demos/";
const output = process.env.UI_POLISH_OUTPUT || "/tmp/ui-polish/final";
const widths = [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920];
const sites = [
  "",
  "clinic",
  "tour-rental",
  "missed-inquiries",
  "business-dashboard",
  "marketing-game",
];
fs.mkdirSync(output, { recursive: true });
const results = [];
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  try {
    for (const slug of sites) {
      const p = await b.newPage({ reducedMotion: "reduce" });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400) errors.push(r.status() + " " + r.url());
      });
      for (const [w, h] of [
        ...widths.map((w) => [w, w === 390 ? 844 : 900]),
        [1916, 976],
        [1024, 768],
      ]) {
        await p.setViewportSize({ width: w, height: h });
        await p.goto(base + (slug ? `projects/${slug}/` : ""));
        for (const lang of slug === "clinic" ? ["en", "de", "ru"] : ["en"]) {
          if (slug === "clinic") await p.selectOption("#language", lang);
          await p.evaluate(() => scrollTo(0, 0));
          assert(
            await p.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
            `${slug} ${lang} ${w} overflow`,
          );
          const geometry = await p.evaluate(() => {
            const rect = (s) => {
              const e = document.querySelector(s);
              if (!e) return null;
              const r = e.getBoundingClientRect();
              return {
                x: r.x,
                y: r.y,
                width: r.width,
                height: r.height,
                bottom: r.bottom,
                right: r.right,
              };
            };
            const sections = [
              ...document.querySelectorAll("main > section"),
            ].map((e) => {
              const r = e.getBoundingClientRect();
              const t = e.querySelector("h1,h2");
              return {
                id: e.id,
                top: r.y,
                bottom: r.bottom,
                height: r.height,
                heading: t?.getBoundingClientRect().y,
                padding: getComputedStyle(e).padding,
              };
            });
            return {
              header: rect(".header"),
              hero: rect(".dental-hero"),
              headline: rect("h1"),
              copy: rect(".hero-copy"),
              facts: rect(".hero-facts"),
              sections,
            };
          });
          if (slug === "clinic") {
            if (w >= 1280) {
              assert(geometry.hero.height < 820, `${lang} tall hero ${w}`);
              assert(
                geometry.headline.y < 320,
                `${lang} detached headline ${w}`,
              );
            }
            if (w <= 380)
              assert(
                geometry.header.height < 110,
                `${lang} wrapped header ${w}`,
              );
            const overlaps = await p.evaluate(() => {
              const panels = [
                ...document.querySelectorAll(".art-caption,.visual-detail"),
              ];
              const text = [
                ...document.querySelectorAll(
                  ".hero-copy h1,.hero-text,.hero-actions,.hero-aside",
                ),
              ];
              return panels.flatMap((a) =>
                text
                  .filter((e) => {
                    const x = a.getBoundingClientRect(),
                      y = e.getBoundingClientRect();
                    return (
                      Math.min(x.right, y.right) - Math.max(x.left, y.left) >
                        1 &&
                      Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1
                    );
                  })
                  .map((e) => [a.className, e.className]),
              );
            });
            assert.deepEqual(
              overlaps,
              [],
              `${lang} floating panel overlap ${w}`,
            );
          }
          if ([390, 1440, 1916].includes(w)) {
            const prefix = `${slug || "portfolio"}-${lang}-${w}`;
            await p.screenshot({
              path: path.join(output, `${prefix}-hero.png`),
              animations: "disabled",
            });
            await p.locator("img:visible").evaluateAll(async (imgs) => {
              for (const img of imgs) {
                img.loading = "eager";
                if (img.src) await img.decode();
              }
            });
            await p.screenshot({
              path: path.join(output, `${prefix}-full.png`),
              fullPage: true,
              animations: "disabled",
            });
            if (slug === "clinic")
              for (const [name, selector] of Object.entries({
                services: "#services",
                principles: ".principles-section",
                journey: ".journey",
                experience: "#experience",
                faq: "#questions",
                appointment: "#appointment",
                footer: ".contact-section",
              })) {
                await p
                  .locator(selector)
                  .evaluate((e) => scrollTo(0, e.offsetTop - 130));
                await p.screenshot({
                  path: path.join(output, `${prefix}-${name}.png`),
                  animations: "disabled",
                });
              }
          }
          results.push({ site: slug || "portfolio", lang, w, h, geometry });
        }
      }
      if (slug === "clinic") {
        for (const width of [320, 390, 768, 1024, 1440, 1916])
          for (const lang of ["en", "de", "ru"]) {
            await p.setViewportSize({ width, height: 900 });
            await p.goto(base + "projects/clinic/");
            await p.selectOption("#language", lang);
            for (const id of [
              "services",
              "experience",
              "questions",
              "appointment",
            ]) {
              // Native hash navigation, including direct entries, must expose the heading.
              await p.goto(base + "projects/clinic/#" + id);
              await p.waitForFunction(
                () =>
                  document.documentElement.lang ===
                  localStorage.getItem("avela-language"),
              );
              const g = await p.evaluate(
                (id) => ({
                  top: document
                    .getElementById(id)
                    .querySelector("h2")
                    .getBoundingClientRect().top,
                  header: document
                    .querySelector(".header")
                    .getBoundingClientRect().bottom,
                }),
                id,
              );
              assert(
                g.top >= g.header + 8,
                `${lang} ${width} #${id} heading covered: ${JSON.stringify(g)}`,
              );
              assert(
                g.top < g.header + 145,
                `${lang} ${width} #${id} detached anchor: ${JSON.stringify(g)}`,
              );
            }
          }
        await p.setViewportSize({ width: 390, height: 844 });
        await p.goto(base + "projects/clinic/");
        await p.selectOption("#language", "en");
        await p.locator("#menu-toggle").click();
        await p.locator('#main-nav a[href="#questions"]').click();
        assert.equal(
          await p.evaluate(() => document.activeElement.id),
          "questions",
        );
        await p.locator('.brand[href="#top"]').click();
        await p.locator('.hero-actions a[href="#appointment"]').click();
        assert.equal(
          await p.evaluate(() => document.activeElement.id),
          "appointment",
        );
        await p.goBack();
        assert(new URL(p.url()).hash === "#top");
        await p.goForward();
        assert(
          await p
            .locator("#appointment h2")
            .evaluate(
              (e) =>
                e.getBoundingClientRect().top >=
                document.querySelector(".header").getBoundingClientRect()
                  .bottom,
            ),
        );
        await p.emulateMedia({ reducedMotion: "no-preference" });
        await p.goto(base + "projects/clinic/");
        await p.locator('.hero-actions a[href="#appointment"]').click();
        await p.waitForFunction(() => {
          const top = document
            .querySelector("#appointment h2")
            .getBoundingClientRect().top;
          return (
            top >=
              document.querySelector(".header").getBoundingClientRect()
                .bottom && top < 300
          );
        });
        console.log(
          "PASS Avela three-language anchor offsets, mobile menu/CTA focus, native history and smooth scrolling",
        );
      }
      assert.deepEqual(errors, []);
      console.log(
        `PASS ${slug || "portfolio"} visual matrix: nine widths, owner-sized desktop, tablet landscape, screenshots and geometry`,
      );
      await p.close();
    }
  } finally {
    fs.writeFileSync(
      path.join(output, "geometry.json"),
      JSON.stringify(results, null, 2),
    );
    await b.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
