# ReplyGap — The Cost of Waiting

A premium, static **Demo / Concept** for exploring how assumed response-delay effects could change inquiry conversion and monthly revenue. This is a hypothetical scenario tool, not evidence of historical loss, a causal forecast, research advice, or a promise of recoverable revenue. Phase 3 only; no dashboard or mini-game is implemented.

## Product and design

Graphite and midnight-indigo surfaces, electric-violet highlights, mint comparison marks, precise typography, and original data-driven SVG graphics establish a SaaS identity distinct from Avela and ORIVELA. The introduction leads into a unified input/results workspace. Clear hierarchy separates the dominant monthly gap from annualization, expected conversions, percentage-point differences, revenue comparisons, and the interactive response curve.

Numeric inputs and native sliders stay synchronized. Presets offer starting assumptions without overriding unrelated inputs. A mobile result strip appears while the input panel is visible, with a jump to results. Reduced-motion users get immediate values without decorative transitions. Report, formula, and business-value sections explain how to use the numbers responsibly.

Serve the repository as described in the root README. Direct route: `/web-demos/projects/missed-inquiries/`. All paths are relative. No installation, build, server application, API, CDN, runtime dependency, key, or image-generation service is required.

## Transparent model

- **N**: monthly inquiries.
- **V**: average revenue per sale, before costs and taxes.
- **P**: assumed conversion probability for responses within five minutes (the percentage input divided by 100).
- **T**: average response time in minutes.
- **R**: conversion retained per doubling of delay beyond five minutes (the retention percentage divided by 100).

```text
D = max(0, log2(max(T, 5) / 5))
delayed conversion = P × R^D
fast-response potential revenue = N × P × V
current-response estimated revenue = N × delayed conversion × V
illustrative monthly gap = max(0, fast revenue − current revenue)
illustrative annual amount = monthly gap × 12
expected missed conversions = N × (P − delayed conversion)
rate difference (percentage points) = (P − delayed conversion) × 100
```

For example, 40 minutes is three doublings from five. Retaining 80% each time multiplies baseline conversion by `0.8³ = 0.512`. Fractional doublings use the logarithm; the model does not round delay into buckets. Responses from zero to five minutes share the same baseline. At 100% retention, response time has no modeled effect.

No costs, profit margins, taxes, repeat purchases, seasonality, service capacity, channel mix, or actual customer behavior are included. The annual amount assumes **12 identical months**, with no compounding. Expected conversions may be fractional; they are not counts of actual customers.

### Defaults and limits

| Input                    | Default    | Accepted range / precision              |
| ------------------------ | ---------- | --------------------------------------- |
| Monthly inquiries        | 240        | 0–100,000; whole number                 |
| Response time            | 40 minutes | 0–10,080 minutes (7 days); whole number |
| Average sale value       | 250        | 0–1,000,000; up to two decimal places   |
| Fast-response conversion | 25%        | 0–100%; steps of 0.1                    |
| Retention per doubling   | 80%        | 1–100%; whole percent                   |
| Currency                 | USD        | USD, EUR, GBP                           |

Rules and defaults are exported by `assets/model.js`. Invalid, empty, out-of-range, nonfinite, or unsupported values produce errors and **no result**; they are never silently clamped or interpreted as zero. Numeric text uses ordinary decimal notation, not scientific notation. Zero inquiries, zero sale value, and zero baseline conversion are valid inputs.

The three **illustrative**, non-research presets change retention only:

| Preset       | Retention | Assumed effect                          |
| ------------ | --------: | --------------------------------------- |
| Conservative |       90% | Smaller loss of conversion per doubling |
| Moderate     |       80% | Default illustrative assumption         |
| Aggressive   |       60% | Larger loss of conversion per doubling  |

Currency selection changes the assumed unit and formatting, **not the numeric amount**. There are no exchange rates or currency conversion. Intl formats USD/EUR/GBP using English-US punctuation and two decimal places; the explicit ISO currency is shown beside inputs and in the report.

### Rounding and independently verified examples

The model calculates rates at full floating-point precision. Each revenue is rounded to integer cents using `Math.round`; the monthly gap is the difference of those displayed cent amounts, so the comparison reconciles. Annualization multiplies the monthly cent gap by 12. Values remain within JavaScript's safe-integer range at all supported limits. Expected conversions and rates display up to two decimal places; rounded expected conversions are not used to calculate revenue.

- Defaults: `240 × 0.25 × 250 = 15,000` fast-response revenue; `15,000 × 0.8³ = 7,680` current revenue. Gap **7,320/month**, **87,840/year**, **29.28** expected missed conversions, **12.2 percentage points** difference.
- 200 inquiries, 400 sale value, 25% conversion, 20 minutes, 80% retention: `20,000 × 0.8² = 12,800` current revenue. Gap **7,200/month**.
- Defaults with Conservative retention: current **10,935**, gap **4,065**. Aggressive retention: current **3,240**, gap **11,760**.
- 15 minutes and 50% retention: `D = log2(3)`, giving one-third of the baseline conversion. Defaults otherwise: current **5,000**, gap **10,000**.
- Rounding boundary: 1 inquiry, 0.03 sale value, 50% baseline, 10 minutes, 50% retention gives rounded revenues **0.02** and **0.01**, monthly gap **0.01**, annual **0.12**.

## Charts and accessibility

The revenue comparison uses the same horizontal scale for baseline and current revenue. Zero revenue has zero filled width. Both exact values are visible and included in the SVG description and data table.

The response curve plots actual model conversion rates against a **logarithmic** five-minute-to-seven-day time axis. The vertical scale uses the selected baseline rate (or 1% when the baseline is zero). The selected-time marker can sit between the six selectable points. Each point is a keyboard button: Enter/Space selects its time; Left/Right/Home/End move focus. The curve is not historical data. A readable table includes all sampled time scenarios and an explicit selected-scenario row, with rates, revenues, and gaps. A narrow table can scroll independently rather than overflowing the page.

Semantic landmarks, one h1, native form controls, associated hints/errors, visible focus, a skip link, chart descriptions, accessible buttons, and a debounced result announcement support keyboard and assistive-technology use. Invalid inputs clear the numbers, hide the curve, empty the report, and disable report actions, preventing stale results from being shared. No-JavaScript mode keeps navigation, explanations, and the formula readable while controls remain disabled and uncomputed results show dashes.

## Reports, contact, and privacy

Copy produces a complete English summary with inputs, assumptions, currency, formula, results, rounding, and limitations. Clipboard denial/unavailability selects the current report for manual copying. If inputs change during an asynchronous copy, stale completion messages are suppressed. Download creates a local UTF-8 `.txt` file; printing produces a plain-text report that includes the full summary, not just the visible textarea viewport.

Nothing is sent to a server. No personal fields, analytics, cookies, sessionStorage, or localStorage are used. Reloading restores defaults. Copy, explicit download, printing, browser autofill, and mail application behavior remain user/browser-managed.

Consultation uses the existing public `../../assets/config.js` email only if it passes validation. Empty or malformed configuration shows an unavailable state and creates no mail link. A valid link opens the visitor's mail application with a generic subject; financial scenario data is **not** attached automatically. Never invent an address or place secrets in this public configuration. The root configuration was not changed for this demo.

## Files

- `index.html`: product introduction, calculator, charts, model explanation, business value, and report.
- `assets/style.css`: complete responsive SaaS design, accessibility states, reduced motion, and print layout.
- `assets/model.js`: pure parsing, validation, calculations, defaults, presets, chart data, currency formatting, and report generation; shared with Node tests.
- `assets/app.js`: input synchronization, SVG rendering, focus behavior, reporting, and safe contact enhancement.
- `assets/favicon.svg`: original ReplyGap mark.
- `tests/model.cjs`: independently checked model tests using Node's built-in test runner.
- `tests/browser.cjs`: Playwright/Chromium and axe checks, with screenshots outside the repository.

## Run development checks

No dependencies are needed for the model tests:

```sh
node --test projects/missed-inquiries/tests/model.cjs
```

Browser tools are optional development dependencies, installed outside the static repository:

```sh
npm install --prefix /tmp/replygap-tools playwright@1.62.1 axe-core@4.14.0
/tmp/replygap-tools/node_modules/.bin/playwright install chromium
python3 -m http.server 8000 --directory /workspace
```

In another terminal, from the repository:

```sh
NODE_PATH=/tmp/replygap-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium node projects/missed-inquiries/tests/browser.cjs
```

Point `CHROMIUM_PATH` at your installed Chromium executable. Set `REPLYGAP_TEST_URL` when using a different server/prefix. Screenshots go to `/tmp/replygap-qa/`. These libraries are never loaded by the website.

Checks cover independent expected financial outputs, invalid and extreme values, all minute delays across seven days for five retention assumptions, currency, presets, reset, rounding, report content, responsive layouts from 320–1920px, input synchronization, chart geometry/table consistency, keyboard controls, copy/fallback, downloads, print layout, reduced motion, mobile result navigation, no-JavaScript fallback, safe contact configuration, accessibility, and absence of external requests/storage/browser errors. Portfolio, clinic, and ORIVELA regression suites run separately.

Limitations: this deliberately simplified model is not validated against real business data. Local Chromium automation and axe do not establish complete WCAG conformance, real-device touch behavior, Safari/Firefox compatibility, or manual screen-reader behavior. Print layout is checked with emulated print media, not physical printers. Email delivery and live GitHub Pages deployment are not tested. There is no lead capture, backend, or persistence.
