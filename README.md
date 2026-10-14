# Ege Sarp Yazıcı — Portfolio foundation

A lightweight, original portfolio for independent web development. Phase 0 presents the developer’s services and approach. Phase 1 adds **Avela**, a complete multilingual clinic website demo. Phase 2 adds **ORIVELA**, a luxury coastal tour and rental demo. Phase 3 adds **ReplyGap**, a transparent response-delay revenue calculator. Phase 4 adds **Ordelle**, a complete fictional business operations dashboard. One **Coming Soon — Demo / Concept** preview remains. All projects are original concepts, not commissioned client case studies.

## Run locally

No installation, build step, API, or environment variable is required. Use Python 3 to serve the repository:

```sh
cd /path/to/web-demos
python3 -m http.server 8000
```

Open the server’s root in a browser. To test the real GitHub Pages prefix from the cloud checkout:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace
```

Request `/web-demos/` on port 8000. HTML, CSS, JavaScript, SVG, and local WebP assets are served directly. The site can also be opened from `index.html`; a local server is recommended for QA. Python is a development convenience, not a hosting dependency.

## Publish on GitHub Pages

After reviewing and merging the changes, open repository **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, then save. The intended site path is `https://egesarpyazici.github.io/web-demos/`. Publication is a separate step and is not implied by a local commit or successful tests. `.nojekyll` keeps hosting static. All asset references are relative, so project-site hosting works without rewriting paths.

## Configure contact details

Edit `assets/config.js`:

```js
window.PORTFOLIO_CONFIG = Object.freeze({
  email: "",
  github: "",
  linkedin: "",
});
```

Replace empty strings only with real public details. Email enables a mailto CTA, using the visitor’s email application; it does not submit to a backend. Social URLs must be complete HTTPS URLs. Missing or invalid entries produce no link. By default, the contact section explicitly says details are coming soon. No invented email address or profile is published. Without JavaScript, the safe default contact state remains visible.

The public display name is in `index.html` (including the title, metadata, branding, and introduction). Never store credentials in configuration.

## Structure

```text
index.html                  Portfolio sections and original mockup artwork
assets/styles.css           Responsive design, interaction and motion preferences
assets/main.js              Menu, focus management, year and contact enhancement
assets/config.js            Public contact configuration
assets/favicon.svg          Original brand mark
projects/clinic/             Avela multilingual clinic demo (Phase 1)
projects/tour-rental/        ORIVELA coastal tour and rental demo (Phase 2)
projects/missed-inquiries/   ReplyGap hypothetical revenue calculator (Phase 3)
projects/business-dashboard/ Ordelle operations workspace (Phase 4)
projects/marketing-game/    Reserved branded mini-game
AGENTS.md                   Permanent standards for future Codex tasks
.nojekyll                   Static GitHub Pages hosting
```

## Design and accessibility

Warm ivory, deep green ink, chartreuse accents, system sans-serif type, and italic serif headings establish an editorial identity. Original CSS/SVG previews explore distinct healthcare, business-tool, dashboard, and game directions. The ORIVELA travel preview uses original generated yacht imagery. All assets are hosted locally, without stock imagery or external runtime requests.

The page includes semantic landmarks, logical headings, a keyboard skip link, visible focus indicators, a mobile disclosure menu with Escape/focus handling, responsive layouts from 320px, and reduced-motion support. Decorative previews are hidden from assistive technology. Content and navigation remain available without JavaScript. The clinic, tour, calculator, and dashboard cards link to their standalone demos and source code. The marketing mini-game remains a noninteractive coming-soon preview.

## Quality assurance

Phase 0 was tested using headless Chromium and Playwright against `/web-demos/` on a local Python server. Browser tooling is development-only and is not shipped as a runtime dependency. The checks cover:

- Widths 320, 375, 390, 520, 521, 768, 1024, 1440, and 1920px; horizontal overflow and five correctly labeled cards.
- Internal navigation targets, mobile menu toggle, Escape, focus transfer, and desktop breakpoint reset.
- Skip-link focus, reduced-motion behavior, and no-JavaScript content/navigation.
- Default contact state, configured email/social links, and rejection of unsafe social URL schemes.
- Browser exceptions and HTTP failures; real requests for all local assets.
- Desktop/mobile screenshot review and automated accessibility checks.

Automated checks do not replace a screen-reader review or testing Safari/Firefox and real touch devices. Phase 0 checks do not establish clinic behavior, email delivery, or live deployment. The clinic has its own browser regression suite described below.

## Roadmap

- **Phase 0:** Portfolio foundation, honest previews, contact configuration, accessibility, and documentation.
- **Phase 1:** Avela clinic website — complete EN/DE/RU demo, service discovery, accessible FAQ, and a client-side appointment inquiry builder.
- **Phase 2:** ORIVELA tour & rental website — original coastal artwork, accessible gallery, itemized EUR estimator, and client-side inquiry builder.
- **Phase 3:** ReplyGap missed inquiries calculator — adjustable hypothetical scenarios, synchronized inputs, live SVG charts, and private report actions.
- **Phase 4:** Ordelle business dashboard — deterministic fictional orders/inquiries, connected analytics, filtering, editing, local persistence, and CSV export.
- **Future:** Branded marketing mini-game — original interaction, keyboard support, accessible alternative.

Each demo requires its own scoped implementation and testing. Add navigation to a demo only after its standalone page is complete. The foundation and Phases 1–4 are implemented. Phase 5 has not begun.

## Phase 1: Avela clinic demo

Open `projects/clinic/` through the static server. Avela uses a refined graphite, mineral-white, and mint healthcare identity, original dimensional SVG/CSS illustrations, and fully translated English, German, and Russian content. It demonstrates how a healthcare business could communicate services and guide international visitors toward a structured inquiry.

The inquiry builder validates sample details, formats dates locally, generates a reviewable summary, and supports copying. Nothing is booked, submitted, or received. WhatsApp is intentionally unconfigured; add a real authorized number only in `projects/clinic/assets/config.js`. No form data is persisted. Only the language preference is saved locally when storage is available.

See [the clinic documentation](projects/clinic/README.md) for configuration, business value, field rules, privacy behavior, browser testing instructions, and limitations. The committed `projects/clinic/tests/browser.cjs` suite checks languages, responsive layouts, navigation, form behavior, clipboard, WhatsApp configuration, and accessibility. Test dependencies are installed outside the repository and are not runtime dependencies.

## Phase 2: ORIVELA tour & rental demo

Open `projects/tour-rental/` through the static server. The fictional coastal brand now uses a cinematic midnight-navy and champagne-gold campaign, with original photorealistic AI-generated yacht, deck, and cove scenes. A separately composed portrait hero keeps the vessel prominent on mobile. The page explicitly identifies its generated imagery and fictional offerings. It includes an accessible keyboard/touch gallery, package-specific options, a live itemized EUR estimate, and a validated inquiry builder with clipboard fallback. No booking or message is sent. WhatsApp remains safely unconfigured.

All rates and limits come from `projects/tour-rental/assets/config.js`. Inclusive dates represent daily private outings, not overnight stays. Calculation uses integer cents and strict calendar-day validation. See [the tour documentation](projects/tour-rental/README.md) for the complete model, independently checked example totals, configuration, test commands, and limitations.

Phase 2 QA covers 30 pricing/invalid-input cases, responsive widths from 320 to 1920px, navigation/focus, gallery buttons/keyboard/emulated touch, inquiry validation, summary generation, real clipboard and denied-access fallback, WhatsApp states, no-JavaScript content, reduced motion, and axe accessibility. Portfolio and EN/DE/RU clinic regression suites are also run. Browser testing is local Chromium validation, not proof of a live GitHub Pages deployment.

## Phase 3: ReplyGap — The Cost of Waiting

Open `projects/missed-inquiries/` through the static server. ReplyGap uses a graphite/indigo and electric-violet SaaS design with synchronized inputs, illustrative retention presets, live KPI cards, accessible SVG revenue/response charts, a data table, and copy/download/print reports. The existing portfolio email configuration powers an optional consultation link; the default remains honestly unavailable. No data is collected, submitted, or persisted automatically.

The pure model assumes conversion is retained by a user-selected factor with each doubling of response time beyond five minutes. All assumptions are visible, adjustable, and explicitly hypothetical. USD/EUR/GBP changes the assumed unit, without exchange-rate conversion. Annualization assumes 12 identical months. Results are not verified historical losses, causal predictions, or guaranteed recoverable revenue.

See [the ReplyGap documentation](projects/missed-inquiries/README.md) for exact formulas, limits, defaults, independent expected totals, accessibility, privacy, and test instructions. Model tests run with Node alone; browser checks use development-only Playwright/Chromium and axe. Portfolio, Avela, and ORIVELA regressions are checked independently. The other demos and shared contact configuration are unchanged.

## Phase 4: Ordelle business operations dashboard

Open `projects/business-dashboard/` through the static server. Ordelle pairs a navy sidebar and cool-white/cobalt workspace with five functional views: overview, orders, inquiries, analytics, and demo settings. Its seeded 180 orders and 96 inquiries drive every metric and chart. Search, combined filters, sorting, pagination, native detail dialogs, status/priority editing with undo, and accurate filtered CSV export work entirely in the browser.

The fixed sample window ends 31 March 2026. Revenue counts paid, non-cancelled orders; open inquiries are new or in progress. Validated overrides and the reporting-period preference persist in `ordelle.demo.v1`. Malformed or blocked storage recovers safely, and confirmed reset affects only this demo. No customer is contacted and nothing is saved to a server.

See [Ordelle documentation](projects/business-dashboard/README.md) for architecture, calculation rules, privacy, test commands, and limitations. Its Node model tests and Chromium/axe browser suite verify data consistency, management interactions, export safety, local state, keyboard accessibility, responsive layouts, and GitHub Pages paths. Other demo implementations are unchanged.
