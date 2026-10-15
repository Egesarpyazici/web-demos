# Ege Sarp Yazıcı — Independent web developer

A static freelance developer portfolio for small businesses, entrepreneurs and startups. Five complete, standalone demos demonstrate business websites, multilingual inquiries, interactive estimators, operations interfaces and branded experiences. Every project is original **Demo / Concept** work, not a commissioned client case study. No fabricated clients, credentials or commercial results are presented.

**[Portfolio](https://egesarpyazici.github.io/web-demos/)** · [Phase 6 audit and launch checklist](PORTFOLIO_AUDIT.md) · [Final UI polish evidence](UI_POLISH_REPORT.md)

## Projects and potential business value

The links below are intended GitHub Pages URLs. Local tests validate the exact `/web-demos/` prefix; live deployment verification is reported separately in the audit.

| Demo                                                                                                     | Problem                                                                 | Solution and features                                                                                                   | Potential business value                                                                                         |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Avela — clinic](https://egesarpyazici.github.io/web-demos/projects/clinic/)                             | Visitors need understandable care information and a clear inquiry path. | EN/DE/RU service pages, persistent language selection, FAQ, validated inquiry summary, clipboard and optional WhatsApp. | Could help a practice communicate across languages and receive more structured questions.                        |
| [ORIVELA — charter](https://egesarpyazici.github.io/web-demos/projects/tour-rental/)                     | Package choices, dates and extras make pricing difficult to understand. | Cinematic generated yacht imagery, accessible gallery, itemized EUR estimate and reviewable inquiry.                    | Could make options and price assumptions easier to evaluate before contacting an operator.                       |
| [ReplyGap — scenario calculator](https://egesarpyazici.github.io/web-demos/projects/missed-inquiries/)   | Teams need a way to discuss the possible effect of response delays.     | Adjustable hypothetical model, synchronized inputs, interactive charts and copy/download/print reports.                 | Could support a conversation about response processes; results are assumptions, not measured losses or promises. |
| [Ordelle — operations dashboard](https://egesarpyazici.github.io/web-demos/projects/business-dashboard/) | Orders and inquiries can be hard to review together.                    | Five views, consistent metrics, search/filter/sort, editable fictional records, undo, CSV and local persistence.        | Demonstrates how a focused workspace could simplify day-to-day review.                                           |
| [VELUNE — branded matching campaign](https://egesarpyazici.github.io/web-demos/projects/marketing-game/) | A collection needs a memorable way to invite exploration.               | Original collectible artwork, keyboard-accessible matching, configurable branding and fictional reward reveal.          | Demonstrates an interactive product-discovery format without claiming engagement or sales results.               |

Each project has [source code](https://github.com/Egesarpyazici/web-demos/tree/main/projects), its own README, configuration guidance and regression tests. The homepage links directly to each individual demo and source directory.

## Run locally

HTML5, CSS3 and vanilla JavaScript only. System fonts, original SVG/CSS graphics and optimized generated WebP images are served locally. No build, framework, backend, database, API key or external runtime dependency is required.

```sh
cd /path/to/web-demos
python3 -m http.server 8000
```

For GitHub Pages path testing from the cloud checkout:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace
```

Request `/web-demos/` on port 8000. Direct entry to every `projects/<name>/` route works. A server is recommended over opening files directly; clipboard support requires HTTPS or localhost and browser permission. Python and QA dependencies are development tools only.

## Contact configuration — required before client outreach

Edit the single public configuration in `assets/config.js`:

```js
window.PORTFOLIO_CONFIG = Object.freeze({
  email: "", // Owner must provide a real public inquiry address.
  github: "https://github.com/Egesarpyazici",
  linkedin: "", // Owner must provide the correct public profile URL.
});
```

The GitHub profile was verified against the repository owner. **Email and LinkedIn are still missing and are launch blockers for the requested client-outreach pass.** Do not infer them from the owner's name or username. Missing/invalid email remains an explicit noninteractive status; a valid email enables a `mailto:` link that opens the visitor's mail application. Nothing is submitted by this site. ReplyGap uses the same email configuration without attaching scenario data.

Social links require HTTPS and reject embedded URL credentials. Only publish the owner's real profile URLs. Without JavaScript, the honest email-unconfigured fallback remains visible. Never put secrets in any public config file. The existing public display name is preserved.

Avela and ORIVELA have separate, intentionally empty WhatsApp destinations in their own `assets/config.js` files. They are fictional demos, so these are not portfolio contact channels or outreach blockers. Enable only with a real authorized destination and deliberate owner intent; opening WhatsApp shares the prefilled URL with that external service, and sending remains the visitor's choice.

## Test the complete portfolio

Use Node.js 22+ and an installed Chromium. Install development dependencies **outside this repository**:

```sh
npm install --prefix /tmp/portfolio-tools --cache /tmp/portfolio-npm-cache --no-package-lock playwright@1.62.1 axe-core@4.14.0
```

Start the prefixed static server above, then run from the repository:

```sh
NODE_PATH=/tmp/portfolio-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium node tests/run.cjs
```

If a system Chromium is unavailable, install Playwright's browser outside the checkout and set `CHROMIUM_PATH` to its executable. The fail-fast runner executes model/pricing tests, homepage checks, all five existing browser suites, VELUNE image/configuration checks, and the cross-site audit. Screenshots/results go to `/tmp`. No testing dependency is loaded by visitors.

Useful individual commands:

```sh
node --test projects/missed-inquiries/tests/model.cjs projects/business-dashboard/tests/model.cjs projects/marketing-game/tests/model.cjs
node projects/tour-rental/tests/pricing.cjs
# Same NODE_PATH and CHROMIUM_PATH environment as above:
node tests/portfolio.cjs
node tests/audit.cjs
node tests/ui-polish.cjs
node tests/slow-network.cjs
```

`tests/audit.cjs` covers all six sites at 320, 375, 390, 430, 768, 1024, 1440 and 1920px, short landscape/reflow viewports, axe WCAG 2.2 AA fundamentals and best practices, metadata, local links/assets, image dimensions, completed project links, contact safety and browser/network errors. Each project's README documents its deeper interaction suite. `PORTFOLIO_TEST_URL` changes the homepage/audit base; existing demo suite overrides are documented in their READMEs. The complete runner defaults to the local prefixed server.

Performance is measured separately with development-only Lighthouse to avoid concurrent browser-test load. See `PORTFOLIO_AUDIT.md` for actual versions, measured scores, limitations and reproducible commands. Automated accessibility scans are not full WCAG certification.

## Hosting and metadata

After owner review and merge, select repository **Settings → Pages → Deploy from a branch → main → /(root)**. The public base is `https://egesarpyazici.github.io/web-demos/`, not the domain root. `.nojekyll` preserves static hosting. A pushed branch does not imply deployment, and Phase 6 does not authorize merging or deploying.

All runtime paths are relative. Canonical/Open Graph URLs and `sitemap.xml` list the six public routes; update them if the repository/domain changes. No nonexistent social preview image is advertised. A project-level `robots.txt` would not control crawling: crawlers read `https://egesarpyazici.github.io/robots.txt`, which belongs to the account-level site. Therefore this repository includes a sitemap but does not pretend to configure root crawler policy.

GitHub Pages controls HTTP compression/cache headers; this source repository cannot configure arbitrary server headers. Keep local assets optimized, verify changes after deployment, and use a fresh asset filename when a future replacement needs cache invalidation. Do not add a service worker merely to mask missing files or force an audit score.

## Maintenance and static-demo limitations

- Preserve the five approved visual identities, original asset provenance, keyboard navigation, focus indicators, reduced motion and explicit demo labels. Change layout only for demonstrated defects.
- Read [AGENTS.md](AGENTS.md) and the affected project's README before changing behavior. Run the complete release suite after shared changes.
- Avela and ORIVELA generate inquiries; they do not book, send, confirm availability or accept payments. Never enter sensitive medical or real client information in demos.
- ReplyGap uses an explicitly hypothetical formula; changing USD/EUR/GBP changes the unit, not an exchange rate. There is no verified or guaranteed financial outcome.
- Ordelle uses seeded fictional records and validated browser-local edits. It has no authentication, server, synchronization or real accounting integration. Reset affects only its own storage key.
- VELUNE has no purchase, tracking or redeemable reward. Its state and artwork are visible in source. Rebrand through `GAME_CONFIG` at the top of its app.js.
- No portfolio message delivery, real-device testing or complete assistive-technology conformance is implied by local automated tests. Follow the audit's owner checklist before outreach.

## Repository map and phase status

```text
index.html, assets/         Main portfolio and public contact configuration
projects/clinic/            Avela + configuration, translations and tests
projects/tour-rental/       ORIVELA + pricing, generated art provenance and tests
projects/missed-inquiries/  ReplyGap + transparent model and tests
projects/business-dashboard/ Ordelle + fictional data, store, analytics and tests
projects/marketing-game/   VELUNE + art provenance, game model and tests
tests/                     Complete runner, homepage and cross-site audit
sitemap.xml                Six public canonical routes
PORTFOLIO_AUDIT.md          Phase 6 findings, evidence, limitations and owner actions
AGENTS.md                  Permanent maintenance standards
.nojekyll                  Static GitHub Pages compatibility
```

Phases 0–5 are implemented. Phase 6 is the focused quality and readiness pass documented in the audit. CV creation, applications and business-development work are outside this repository phase.
