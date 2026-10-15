# Portfolio quality and client-readiness audit

**Audit date:** 15 October 2026 (Europe/Istanbul)

**Repository:** [Egesarpyazici/web-demos](https://github.com/Egesarpyazici/web-demos)

**Branch:** `portfolio/phase-6-final-audit`

**Baseline:** `7b1864f` — latest merged main when the audit began, including approved VELUNE redesign PR #10.

## Executive summary

All six sites load and function under the exact local `/web-demos/` prefix. The five approved identities are preserved: no CSS redesign, image replacement, new demo, model change or runtime dependency was introduced. All 25 tracked SVG/WebP assets were checked byte-for-byte against the merged baseline and remain unchanged.

Targeted changes address accessible brand names, Avela's demo-bar landmark, metadata, project link names, VELUNE heading spacing, outdated documentation and repeatable release testing. The owner's verified GitHub profile is now linked. **A real public email address and LinkedIn profile are still required before the requested client-outreach launch.** Neither was inferred or invented.

No reproducible Critical implementation defect was found. Identified High accessibility issues were fixed; the outstanding High contact-readiness issue requires owner input. Functional regression checks pass. This is local laboratory evidence, not proof of production deployment, complete WCAG conformance or compatibility with every browser.

| Readiness area  | Recommendation                         | Evidence / condition                                                                                                                                  |
| --------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Technical       | **Go for code review**                 | Model, browser, accessibility, navigation, asset and throttled-mobile checks pass locally. Verify the published site after approved merge/deployment. |
| Visual          | **Go with approved designs preserved** | Desktop/mobile screenshot review; no unintended overflow at the eight required widths; original assets unchanged.                                     |
| Contact         | **No-go for outreach**                 | GitHub works, but email and LinkedIn remain empty. No working direct inquiry destination is promised.                                                 |
| Client outreach | **Hold**                               | Configure and test real contact details, review/merge, verify GitHub Pages and perform the remaining browser/device/assistive-technology checks.      |

## Projects audited

| Site      | Route                                     | Principal behavior preserved                                                                             |
| --------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Portfolio | `/web-demos/`                             | Five real demo/source links, mobile navigation, skip link, safe contact enhancement                      |
| Avela     | `/web-demos/projects/clinic/`             | EN/DE/RU, language persistence, FAQ, inquiry validation/summary, clipboard, WhatsApp configuration       |
| ORIVELA   | `/web-demos/projects/tour-rental/`        | Responsive yacht imagery, gallery, packages, inclusive dates, EUR pricing/extras, inquiry and sharing    |
| ReplyGap  | `/web-demos/projects/missed-inquiries/`   | Hypothetical model, synchronized controls, presets, reconciled charts, currency display and reports      |
| Ordelle   | `/web-demos/projects/business-dashboard/` | Five views, filtering/sorting/pagination, editing/undo, metrics, CSV, local state and dialogs            |
| VELUNE    | `/web-demos/projects/marketing-game/`     | Deck integrity, matching/timers/restart, keyboard play, collectible mappings, reward/copy and rebranding |

These are fictional static demonstrations, not operational medical, charter, financial, commerce or rewards services. The README now gives each project's problem, solution/features and potential business value without claiming measured outcomes.

## Environment and scope

- Debian GNU/Linux 13; Node.js 24.19.0; Python 3.12.14 static server.
- Chromium 154.0.8037.57, headless, with Playwright 1.62.1 and axe-core 4.14.0.
- Lighthouse 13.5.0; local HTTP, desktop preset and default simulated mobile settings. No simultaneous browser regression load during measurements.
- Functional tests use `http://127.0.0.1:8000/web-demos/`; browser/test dependencies and reports stay outside the repository.
- Automated screenshots, logs and Lighthouse JSON were retained in `/tmp/phase6-qa/` and project-specific `/tmp/*-qa/` folders in this task workspace. They are not shipped website assets and are not durable public report URLs.
- Existing commits and main were preserved. No merge, Pages configuration change or deployment was performed.

## Tests actually run

| Check                  | Result and coverage                                                                                                                                                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node model tests       | **39 passed, 0 failed**: ReplyGap 20, Ordelle 9, VELUNE 10. Independent formulas/boundaries, chart/KPI reconciliation, deterministic records, state/storage/CSV and game transitions.                                                                                                                                                                        |
| ORIVELA pricing        | **30 independent cases passed**, including extras, package totals, guest/date limits, leap dates and DST-safe arithmetic.                                                                                                                                                                                                                                    |
| Homepage browser suite | Passed: completed cards, anchors, menu/Escape/focus/breakpoint behavior, skip link, reduced motion, configured/unconfigured contacts, unsafe URL rejection, no-JS and asset/browser errors. Now committed as `tests/portfolio.cjs`.                                                                                                                          |
| Avela browser suite    | Passed EN/DE/RU content/errors and responsive checks, local language persistence, form boundaries, summary, real clipboard readback and denial fallback, WhatsApp states, native FAQ, menu/focus, blocked storage and no-JS.                                                                                                                                 |
| ORIVELA browser suite  | Passed package/date/guest/extras calculations, summaries, gallery keyboard/buttons/emulated touch, responsive image source selection, menu/focus, clipboard, WhatsApp states, stale sharing-link removal and no-JS.                                                                                                                                          |
| ReplyGap browser suite | Passed all input pairs/presets, independent results, empty/extreme/zero cases, chart-data agreement and keyboard points, currencies, copy/denial, real download, emulated print, contact safety and no-JS.                                                                                                                                                   |
| Ordelle browser suite  | Passed five views, combined filters, both sort directions, pagination, local edits/undo and metric changes, CSV download, persistence/reset/corruption, dialogs/focus, history/navigation and no-JS. Rerun after the metadata synchronization fix.                                                                                                           |
| VELUNE browser suite   | Passed pair completion, duplicate/rapid input, mismatch lock, restart during timers, reward focus, actual clipboard/denial, late promises, keyboard-only completion, reduced motion, rebranding, blocked storage and no-JS.                                                                                                                                  |
| VELUNE artwork suite   | Passed ten decoded local images, 264,824-byte image budget, full 1440 × 900 deck visibility, remapping and playable missing-image fallback.                                                                                                                                                                                                                  |
| Cross-site audit       | Passed 48 initial layout cases, 12 landscape/reflow cases, unique titles/descriptions, canonical/OG consistency, local navigation/assets, image dimensions/alt attributes, sitemap and malicious/invalid contact values. Clinic metadata follows all three languages; Ordelle metadata follows all five views.                                               |
| Throttled mobile smoke | All six passed at 390 × 844, cold cache, 150 ms latency, 1.6 Mbps download, 0.75 Mbps upload and 4× CPU slowdown. Menu, translation, extra selection, slider synchronization, period change and card reveal remain usable.                                                                                                                                   |
| Repository inspection  | No unexpected runtime dependency, generated QA artifact, node_modules, API call or common private-key/token pattern found in tracked source. Only bundled trusted clinic translations use innerHTML; entered/stored/configurable content uses safe text/DOM handling. This is a scoped review, not a security certification or full Git-history secret scan. |

The first expanded audit failed on Ordelle's new Open Graph title remaining static while the document title changed. The implementation was corrected, all-view metadata regression coverage added, and the affected audits rerun successfully. The final `node tests/run.cjs` run completed the entire chain with exit status 0. Accessibility findings from the initial scan are listed below; they were not silently ignored.

### Reproduce

Start the prefixed static server using the root README, then:

```sh
NODE_PATH=/path/to/qa/node_modules CHROMIUM_PATH=/path/to/chromium node tests/run.cjs
NODE_PATH=/path/to/qa/node_modules CHROMIUM_PATH=/path/to/chromium node tests/slow-network.cjs
```

The runner stops at the first failure. Each browser suite and model file can also run independently. No successful result is inferred from a zero-test run.

## Accessibility results

The cross-site audit reports **zero violations** for its axe WCAG 2 A/AA, WCAG 2.1 AA, WCAG 2.2 AA and best-practice rules at 320 and 1440px on all six initial pages. Existing suites additionally scan translated clinic/forms, calculator invalid states, dashboard views/dialogs and VELUNE completion/copy/rebrand states. Visible-name checks specifically cover brand/project links and translated clinic logos.

Keyboard evidence covers skip links, visible focus, menu Escape/focus transfer, native FAQ disclosures, labeled/associated form errors, chart point controls, scrollable tables, dialog containment/return, and complete VELUNE play. Reduced motion and readable no-JavaScript fallbacks passed. No image lacks width/height or an alt attribute. ORIVELA's small checkbox glyphs sit inside large clickable labels; the entire label is the touch target, not just the glyph. VELUNE cards remain at least 44 × 44px at tested widths.

Lighthouse's additional visible-label diagnostic still flags VELUNE's decorative card faces in its raw report: it reads branded back text and the rotated, non-visible front together. Card faces are aria-hidden and the native button exposes a numbered face-down name, then the revealed object/matched state. The hidden answer was deliberately **not** added to face-down names merely to satisfy that heuristic. Keyboard completion and name/state tests pass; real voice-control and screen-reader review remain untested.

No claim of full WCAG 2.2 AA compliance is made. NVDA, JAWS, VoiceOver, TalkBack, real voice control, high-contrast OS modes and physical touch devices were not manually tested. Automated contrast checks do not establish every possible image/gradient/text combination.

## Responsive and visual review

All six pages were checked at **320, 375, 390, 430, 768, 1024, 1440 and 1920px**. No unintended page-level horizontal overflow was found. Extra checks used 844 × 390 landscape and 720 × 450, a CSS-viewport approximation of 200% desktop zoom; actual OS/browser zoom is not implied.

Desktop and mobile viewport/full-page captures were reviewed for hero composition, legibility, form/table/chart layout and card crops. Lazy images were decoded before final full-page captures. The dental implant, desktop/portrait yacht selection, calculator hierarchy, dashboard sidebar/tables and portrait collectible deck remain intact. Existing scenario screenshots also cover long German/Russian text, inquiry summaries, dashboard dialogs and VELUNE completion. No visual redesign or stylesheet edits were needed.

## Performance measurements

These are local, single-run Lighthouse laboratory samples, not field Core Web Vitals, percentiles, production CDN measurements or a performance guarantee. The latest available run per page/device is reported; targeted rechecks followed accessibility/metadata fixes. The Python server does not reproduce GitHub Pages compression/cache headers. Request bytes include the resources loaded during that run, not every below-fold image in the repository.

| Site      | Performance mobile / desktop | Mobile LCP | Mobile CLS | Desktop CLS | Loaded bytes mobile / desktop |
| --------- | ---------------------------: | ---------: | ---------: | ----------: | ----------------------------: |
| Portfolio |                    100 / 100 |     1.50 s |      0.056 |       0.000 |             162,732 / 203,222 |
| Avela     |                     98 / 100 |     1.88 s |      0.084 |       0.000 |             156,695 / 156,695 |
| ORIVELA   |                     93 / 100 |     2.86 s |      0.069 |       0.000 |             835,826 / 734,499 |
| ReplyGap  |                    100 / 100 |     1.51 s |      0.000 |       0.000 |               87,043 / 87,043 |
| Ordelle   |                      97 / 99 |     1.75 s |      0.096 |       0.061 |             101,885 / 101,885 |
| VELUNE    |                     97 / 100 |     2.61 s |      0.000 |       0.031 |             263,019 / 263,019 |

All measured runs scored 100 for Lighthouse accessibility, best practices and SEO; those category scores do not erase the limitations and optional card-label diagnostic described above. Initial image-heavy mobile LCP and dynamic-layout shifts are retained as measurements, not hidden by disabling art or functionality.

Image assets remain locally hosted WebP with explicit dimensions. ORIVELA uses a distinct mobile hero source and eager/high-priority hero; supporting imagery is lazy-loaded. VELUNE uses eight 384px images plus two 960px variants, 264,824 bytes total. Its configurable image source is assigned by JavaScript; Lighthouse notes that discovery chain, but no extra remote service is involved. The largest image-heavy load is ORIVELA; approved photography was not replaced or degraded for a score.

Lighthouse suggests minification, unused-at-load CSS reduction, image resizing and cache lifetimes. Much of the “unused” code supports later views, translations, dialogs, responsive states or interactions. Aggressive removal would risk regressions. No build pipeline was added for small static files. GitHub Pages owns caching/compression headers; verify those on the actual deployment. Dynamic initial UI can produce a small layout shift, especially Ordelle; record field measurements before treating a local sample as a production regression.

Reproduce a measurement with Lighthouse installed outside the checkout:

```sh
npm install --prefix /tmp/portfolio-perf --cache /tmp/portfolio-perf-cache --no-package-lock lighthouse@13.5.0
CHROME_PATH=/path/to/chromium /tmp/portfolio-perf/node_modules/.bin/lighthouse \
  http://127.0.0.1:8000/web-demos/ \
  --chrome-flags="--headless --no-sandbox" \
  --only-categories=performance,accessibility,best-practices,seo \
  --output=json --output-path=/tmp/portfolio-mobile.json
# Add --preset=desktop for desktop; repeat with each projects/<name>/ route.
```

## Findings and resolution

Severity reflects impact on this static portfolio and the requested outreach launch, not hypothetical backend functionality.

| ID   | Severity | Reproduced finding                                                                                                                              | Resolution / remaining action                                                                                                                                                                                                                                     |
| ---- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C-00 | Critical | No reproducible Critical defect found in the audited scope.                                                                                     | No critical fix claimed.                                                                                                                                                                                                                                          |
| H-01 | High     | No public inquiry email or LinkedIn profile is configured. The primary project-contact action cannot reach the owner.                           | **Open — owner required.** Keep unknown values empty; explicitly mark email unavailable. GitHub alone does not complete the requested contact checklist.                                                                                                          |
| H-02 | High     | Portfolio, Avela and VELUNE brand-link accessible names omitted visible brand/service text, affecting label-in-name and voice-control matching. | **Fixed.** Prefer natural visible names; localized Avela names include the visible descriptor in EN/DE/RU. Explicit regression checks pass. New project link names preserve the full visible “Live Demo” / “View Source Code” text before adding project context. |
| M-01 | Medium   | Avela's demo notice/back link sat outside a landmark (`region` finding).                                                                        | **Fixed.** The same demo bar is a semantic aside; layout unchanged.                                                                                                                                                                                               |
| M-02 | Medium   | All six pages lacked canonical/Open Graph metadata and a shared discovery sitemap.                                                              | **Fixed.** Correct project-site URLs, unique existing titles/descriptions, six-route sitemap. Metadata follows clinic language, VELUNE branding and Ordelle view changes. No invented social image.                                                               |
| M-03 | Medium   | AGENTS and multiple project READMEs incorrectly described completed demos as future/unimplemented work.                                         | **Fixed.** Maintenance instructions, phase status, business-value summaries, configuration, limits and test commands updated.                                                                                                                                     |
| M-04 | Medium   | Homepage regression tooling existed only outside the checkout; release checks were not reproducible from repository instructions.               | **Fixed.** Committed homepage/cross-site/slow-network suites and fail-fast runner, with external dependency instructions.                                                                                                                                         |
| M-05 | Medium   | GitHub contact was empty despite a known authorized profile.                                                                                    | **Fixed.** Profile GET returned HTTP 200 and matched the repository owner; public link configured.                                                                                                                                                                |
| L-01 | Low      | VELUNE headline text concatenated “ofsmall” in DOM text.                                                                                        | **Fixed.** Added whitespace between inline text nodes without changing the approved composition.                                                                                                                                                                  |
| L-02 | Low      | Local Lighthouse flags caching/minification/image opportunities and small dynamic layout shifts.                                                | **Documented.** Keep quality and no-build architecture; inspect actual Pages caching and field behavior before further optimization.                                                                                                                              |
| L-03 | Low      | Three earlier ORIVELA SVG studies remain on disk.                                                                                               | **Reviewed, preserved.** They are explicitly documented historical assets and are not referenced or requested at runtime.                                                                                                                                         |

## Production links and external checks

On the audit date, the public GitHub profile and all five `tree/main/projects/...` source URLs returned **HTTP 200**. Each source route matches the corresponding local demo directory. All local demo, back-to-portfolio, fragment and asset paths passed under `/web-demos/`; Ordelle's five hash routes are intentionally handled by its existing client-side view logic.

An actual request to `https://egesarpyazici.github.io/web-demos/` failed at the environment's CONNECT proxy with **403 Forbidden**. This is a network-access limitation, not evidence that the published site itself returns 403 or is unavailable. **Production HTML, deployed assets, live canonical metadata, server caching and post-merge deployment were not verified.** Local checks are not substituted for a production success claim.

## Remaining limitations and owner-required actions

1. Supply a real public inquiry **email address** and the correct **LinkedIn profile URL** in `assets/config.js`. Both remain explicit outreach launch blockers under this task's requirements. Never put mailbox passwords or tokens there.
2. Test the configured mail link with an actual mail application and verify that the address can receive replies. No email was sent by this audit.
3. Review the feature branch, approve merge and deploy through GitHub Pages. This task does not authorize those actions.
4. Open the published homepage and all five direct demo URLs from a normal browser/network after deployment; check demo/source/back links and assets. Confirm the deployment contains the approved commit.
5. Before broad outreach, perform Safari/Firefox, iOS/Android physical-device, screen-reader and voice-control checks. No cross-browser or assistive-technology success is implied by Chromium emulation.
6. Consider Search Console submission of `/web-demos/sitemap.xml` after verifying production. A robots.txt inside this project path cannot control the account-domain root and was intentionally not added.

No real medical booking, charter availability, payment, financial forecast validation, customer messaging, backend save, real reward redemption or external WhatsApp send was tested or promised. The public name remains Ege Sarp Yazıcı. CV creation and job applications are out of scope.

## Final pre-client-launch checklist

- [x] All five completed demos and correct homepage live/source paths exist.
- [x] Approved artwork and visual identities preserved.
- [x] Local model/pricing/browser, accessibility, responsive and throttled-mobile checks pass.
- [x] Safe contact states, verified GitHub profile and clear Demo / Concept disclosures.
- [x] Metadata, sitemap, project summaries, maintenance instructions and audit evidence documented.
- [ ] Owner supplies and verifies public email and LinkedIn.
- [ ] Owner reviews and approves merge/deployment.
- [ ] Actual GitHub Pages deployment and six public routes verified after merge.
- [ ] Remaining physical-device, alternative-browser and manual assistive-technology review completed.

**Decision:** ready for technical review with the approved designs intact; **not yet ready for client outreach** until the owner contact and deployment checks are completed.
