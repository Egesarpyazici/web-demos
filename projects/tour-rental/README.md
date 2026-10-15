# ORIVELA — private coastal experiences

Phase 2 is a complete static tour and rental **Demo / Concept**. ORIVELA is fictional: no real operator, vessel, route, availability, customer claims, payment, reservation, or booking is represented. The current campaign uses original AI-generated photorealistic concept imagery, clearly identified on the page. The fictional vessels and scenes are not inventory or documentary photographs.

## Experience

Midnight navy, near-black, silver-white, and champagne gold create a cinematic luxury identity distinct from the clinic. A dominant front three-quarter superyacht, warm cabin lights and ocean reflections, oversized serif headline, precision arc, and restrained concept callouts lead the campaign. A separately composed portrait image preserves the yacht on mobile. Photorealistic cove and sunset-deck scenes carry the art direction through the gallery and open-layout package cards. The estimate and inquiry retain quiet, light surfaces for readability. Layouts support 320–1920px. Navigation, gallery controls, FAQ, form errors, and visible focus work by keyboard; motion respects the user's preference.

Serve the repository with Python as described in the root README. Direct GitHub Pages path: `/web-demos/projects/tour-rental/`. All assets use relative paths. There is no installation, build, backend, API, analytics, external asset, or runtime dependency.

## Files

- `index.html`: semantic content, gallery, estimator, inquiry, FAQ, and contact.
- `assets/style.css`: shared layout, responsive controls, focus, and motion preferences.
- `assets/luxury.css`: cinematic campaign, art-directed hero, and full-site visual restyle.
- `assets/config.js`: the single public pricing/limits/contact configuration.
- `assets/pricing.js`: pure date validation and integer-cent calculations, usable in the browser and Node.
- `assets/app.js`: accessible interactions, rendering, validation, summary, clipboard, and optional WhatsApp.
- `assets/yacht-*.webp`: optimized local generated campaign imagery; see [image provenance](assets/IMAGES.md).
- `assets/favicon.svg`: original brand mark. The earlier `coast.svg`, `sunset.svg`, and `islands.svg` studies are preserved but no longer rendered.
- `tests/pricing.cjs`, `tests/browser.cjs`: development-only regression checks.

## Pricing model and configuration

Edit only `window.ORIVELA_CONFIG` in `assets/config.js` to change rates or limits. Monetary amounts are **integer EUR cents**, not euros. All package cards, option labels, guest rules, extras, and estimates read that object. Keep the documented structure, valid positive integer limits, nonnegative integer monetary amounts, and the four supported extra bases below. Configuration is trusted developer input, not a public editing interface. Never put secrets in it.

Dates are **inclusive**: the same start/end date is one billable day. Every chosen calendar date repeats one private daytime outing; multi-day selections do not include overnight accommodation. Start and end must each be 1–365 days from the visitor's local current date. Maximum duration: 7 days. Minimum guests: 1. Strict calendar parsing and UTC day arithmetic avoid daylight-saving duration errors.

| Package        | Base / day | Included / maximum guests | Additional guest / day | Package options                                     |
| -------------- | ---------: | ------------------------: | ---------------------: | --------------------------------------------------- |
| Coastal Escape |     €1,200 |                    6 / 10 |                    €75 | Island passage included; secluded coves +€140/day   |
| Golden Hour    |       €780 |                     4 / 8 |                    €60 | Classic sunset included; extended evening +€180/day |
| Signature Days |     €1,900 |                    8 / 12 |                    €90 | Motor yacht included; premium sailing +€240/day     |

| Extra                 | Price | Configuration basis | Calculation                          |
| --------------------- | ----: | ------------------- | ------------------------------------ |
| Onboard host          |  €180 | `day`               | days × price                         |
| Coastal tasting menu  |   €65 | `guest-day`         | all guests × days × price            |
| Paddleboard set       |   €90 | `booking`           | charged once for the full date range |
| Return shore transfer |   €35 | `guest`             | all guests × price, once per trip    |

Total = daily base × days + guests beyond the included allowance × daily guest fee × days + daily option fee × days + selected extras. A smaller party pays the full base. No additional taxes, fees, discounts, deposits, or payments are calculated. These are fictional estimates, never binding quotes. Invalid input clears the previous total and blocks summary generation.

Independent reference totals used in tests:

- Coastal Escape, 1 day, 6 guests, island passage, no extras: **€1,200**.
- Coastal Escape, 3 days, 8 guests, coves, all extras: €3,600 + €450 + €420 + €540 + €1,560 + €90 + €280 = **€6,940**.
- Golden Hour, 2 days, 6 guests, extended evening, host and tasting: €1,560 + €240 + €360 + €360 + €780 = **€3,300**.
- Signature Days, 7 days, 12 guests, sailing, all extras: €13,300 + €2,520 + €1,680 + €1,260 + €5,460 + €90 + €420 = **€24,730**.

## Inquiry, privacy, and WhatsApp

Full name (2–80 characters including a letter), email (up to 254 characters), and phone (7–15 digits, optional leading plus and common separators) are required. The optional message has a 600-character limit. Travel details come directly from the validated estimator. Errors are associated with fields; submission focuses the first invalid field. Success reveals and focuses a review section, **not a sent/booking confirmation**. User input is rendered as text, never HTML.

Clipboard copying uses the browser Clipboard API. If unavailable or denied, the summary receives focus and selection with explicit manual-copy instructions. Editing contact or travel details clears the old summary and sharing link. Nothing is persisted in localStorage, cookies, or a database. Reloading clears entered data; browser autofill remains browser-managed.

`whatsappNumber` defaults to an empty string. To enable click-to-chat, supply a real authorized international number containing 7–15 digits, without plus, spaces, or a leading zero. Empty or malformed values produce an honest noninteractive unconfigured state. No invented destination is shipped. When configured, the inquiry link URL-encodes the exact reviewable summary. Clicking it opens WhatsApp, an external service; sending remains the visitor's choice. The footer contact link contains only a general concept question. Tests configure a number only inside intercepted test responses and never open/send to it.

Without JavaScript, navigation, artwork, package descriptions, FAQ, and honesty notices remain readable. All gallery scenes are visible. Calculation/inquiry fields stay disabled with an explanation; prices and interactive controls are enhanced by JavaScript.

## Run development tests

These tools are optional development dependencies, kept outside the static repository:

```sh
npm install --prefix /tmp/orivela-tools playwright@1.62.1 axe-core@4.14.0
# Use an installed Chromium, or install Playwright's browser:
/tmp/orivela-tools/node_modules/.bin/playwright install chromium
python3 -m http.server 8000 --directory /workspace
```

In another terminal, from the repository:

```sh
node projects/tour-rental/tests/pricing.cjs
NODE_PATH=/tmp/orivela-tools/node_modules CHROMIUM_PATH=/usr/bin/chromium node projects/tour-rental/tests/browser.cjs
```

Set `CHROMIUM_PATH` to your installed browser. Set `TEST_URL` if the server/prefix differs. Screenshots are written outside the repository to `/tmp/orivela-qa/`. The browser suite uses Playwright, Chromium, and axe-core; none are loaded by the site.

Coverage: independent pricing totals, invalid/empty/reversed/out-of-range dates, leap dates and DST-safe days, guest and duration limits, unknown/duplicate extras, eight responsive widths, mobile/desktop hero source selection and visible headline/CTA, artwork loading, internal anchors, menu and focus, skip link, keyboard/button gallery navigation, Chromium-emulated touch swipes, FAQ, reduced motion, inquiry validation, safe summary text, real clipboard readback and denial fallback, configured/unconfigured/invalid WhatsApp, stale-summary removal, no-JavaScript fallback, and automated accessibility at 320/1440px. The root portfolio and unchanged multilingual clinic are regression-tested separately.

Limitations: Chromium automation and emulated touch do not replace Safari/Firefox, real-device touch, or manual screen-reader testing. No real-world charter availability, weather, safety assessment, licensing, accessibility suitability, tax calculation, message delivery, or deployed GitHub Pages state is verified. A production operator needs real content, policies, contact details, and a separate booking backend if desired. All five portfolio demos are implemented; see ../../PORTFOLIO_AUDIT.md for the repository-wide audit.

## Luxury overhaul verification

The new hero was reviewed in Chromium at 1440 × 900 and on 320/390px mobile layouts. Its original generated vessel replaces the previous flat vector hero. The mobile scene is a separately generated portrait composition, not a desktop crop. The page keeps its disclosure of generated imagery and fictional offerings. No fake speed, cabin count, vessel capacity, awards, or operating statistics were introduced.

All existing pricing, contact validation, copy/fallback, WhatsApp, gallery, navigation, and accessibility regressions pass after the visual overhaul. Pure pricing/config files remain unchanged. Portfolio and clinic regression checks also pass; the clinic and unrelated project cards are unchanged. Assets are served locally with responsive selection, an eager high-priority hero, and lazy-loaded supporting images. No image-generation service or other external dependency is called at runtime.
