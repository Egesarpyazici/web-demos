# Avela — multilingual clinic website concept

**Phase 1 · Live Demo — Concept**

Avela is a fictional private clinic identity and an original static website. Its refined visual system uses mineral whites, graphite, restrained mint, modern sans-serif typography, and original dimensional healthcare illustrations. The design is deliberately distinct from the main portfolio. There are no fabricated clinicians, qualifications, testimonials, medical outcomes, or real facilities.

## Business value

This demo shows how a clinic, dental practice, or wellness business could introduce its services clearly, communicate across languages, explain the patient journey, and help visitors prepare a structured inquiry. It is a portfolio demonstration, not an operating healthcare service or booking system.

## Run and host

No install, build, framework, backend, or external runtime dependency is required. From `/workspace`, run:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace
```

Request `/web-demos/projects/clinic/` on port 8000. The same relative paths support GitHub Pages at `https://egesarpyazici.github.io/web-demos/projects/clinic/` after this branch is merged and Pages deployment succeeds. That address is a deployment target, not proof of publication.

## Features

- English, German, and Russian interface translations, including navigation, SEO description/title, accessibility labels, field errors, summaries, and status messages. Language selection updates the page without reload and preserves form values.
- A language preference stored under `avela-language` when localStorage is available; English is the default. Blocked storage is handled without breaking the page.
- Original sculpted-tooth SVG illustration, dimensional CSS medical-symbol study, CSS architectural reception study, service cards, service-selection shortcuts, principles, patient journey, and native keyboard-accessible FAQ disclosures.
- Mobile navigation with Escape handling, focus transfer and resize reset; skip link, visible focus, semantic structure, reduced motion, and responsive layouts from 320px upward.
- A client-side inquiry builder with name, email, phone, service, preferred date/time, and optional message. Validation displays localized inline errors associated with fields and focuses the first invalid field.
- A reviewable, localized summary, actual Clipboard API copying when allowed, and a selectable-text fallback when copying is denied or unsupported.
- A configurable WhatsApp action with safely encoded inquiry text and an explicit unconfigured state.

## Public WhatsApp configuration

Edit the **single destination value** in `assets/config.js`:

```js
window.CLINIC_CONFIG = Object.freeze({ whatsappNumber: "" });
```

Leave it empty until the owner provides a real, authorized destination. To enable click-to-chat, use the international number as a string containing a country code and 7–15 digits total, with no leading zero, plus sign, spaces, or punctuation. Invalid or missing values show “WhatsApp not configured” and produce no WhatsApp link. No credentials or API key are needed or permitted in this public file.

The contact action prefills a localized general question; the summary action prefills the complete generated inquiry. The visitor must deliberately open WhatsApp and choose whether to send there. Opening that link shares its URL/message with an external service; it is not a backend form submission. The site never claims delivery, receipt, or booking. Changing a form value hides the previous summary and removes its sharing URL until regenerated.

## Form behavior and privacy

- Full name: 2–80 characters, including at least one Unicode letter. Do not enter real patient details.
- Email: a syntactically plausible address up to 254 characters; no deliverability check.
- Phone: 7–15 digits; one optional leading `+`, spaces, parentheses, and hyphens are accepted. A country code is requested but not looked up or verified against a country database.
- Date: tomorrow through 90 days ahead, inclusive, using the device’s local calendar date. Limits refresh on date focus, language change, and form submission. Summary and range labels use `Intl.DateTimeFormat` for the selected language. Native calendar controls follow browser/OS locale conventions.
- Time: four sample windows only, not a live schedule or availability promise.
- Message: optional, at most 600 characters. No sensitive medical details.
- Personal details remain only in page memory. They are not saved in localStorage, sent to a server, or included in navigation requests. Reloading clears the form; only the language preference persists.
- User input is rendered as text, never HTML. Only trusted, bundled heading translations contain limited presentation markup.
- Without JavaScript, English information, navigation, and FAQs work. The inquiry fieldset and language selector remain disabled; no data can accidentally be submitted.

## Files

- `index.html` — semantic English fallback and complete page structure.
- `assets/clinic.css` — isolated responsive visual identity and interaction states.
- `assets/clinic.js` — translations, navigation, validation, summaries, clipboard, WhatsApp.
- `assets/translations.js` — complete matching EN/DE/RU dictionaries.
- `assets/config.js` — public WhatsApp destination only.
- `assets/precision.svg`, `assets/favicon.svg` — original local graphics.
- `tests/browser.cjs` — development-only Chromium/Playwright and axe regression suite.

## Browser QA

Browser tooling is optional development infrastructure; none is served or required by the application. Install it **outside the repository** if not already available:

```sh
npm install --prefix /tmp/avela-qa --cache /tmp/avela-npm-cache --no-package-lock playwright axe-core
```

Use an installed Chromium browser:

```sh
NODE_PATH=/tmp/avela-qa/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node projects/clinic/tests/browser.cjs
```

Run from the repository root with the server above running. If a system Chromium is unavailable, install Playwright’s Chromium with `/tmp/avela-qa/node_modules/.bin/playwright install chromium`, then omit `CHROMIUM_PATH`. System browser dependencies may also be required. `CLINIC_TEST_URL` overrides the test URL; `CLINIC_SCREENSHOTS` overrides the screenshot directory (default `/tmp/clinic-qa-screenshots`).

The suite verifies translation-key completeness and rendered strings, all three languages at eight widths (320–1920px), persistence, navigation/keyboard focus, FAQs, reduced motion, invalid and valid forms, date bounds, language changes after entry, summary escaping, real clipboard copy and denied-copy fallback, missing/invalid/configured WhatsApp destinations and encoded content, blocked storage, no-JavaScript fallback, no external runtime requests, no HTTP/browser errors, and axe WCAG A/AA checks in all three languages at mobile and desktop widths. Configured WhatsApp tests intercept only the local configuration script; they never contact WhatsApp or send a message.

Manual review should additionally cover real touch devices, screen readers, cross-browser date pickers, and professional native-language editorial review. Automated accessibility results are not an accessibility certification.

## Limitations

No medical advice, real staff, real address, live availability, appointment booking, message submission, delivery verification, or backend storage. No WhatsApp destination is configured by default. Safari/Firefox, assistive technology, real-device behavior, and live GitHub Pages deployment require separate verification. All other portfolio demos remain future work; Phase 2 has not begun.

## Phase 1 visual refinement

The redesigned hero centers on an original ceramic-tooth sculpture, precision ring, reflective platform, and restrained detail panels. All artwork is CSS/SVG; it is not a real product, device, or facility. The old lounge illustration has been replaced.

A graphite/mint brand mark, translucent sticky navigation, bordered language control, stronger CTAs, unified white service/process cards, a dark principles section, and a refined inquiry panel form one visual system. No external font or runtime dependency was introduced. Sticky-header offsets accommodate anchor navigation, and motion remains optional through reduced-motion support.

All updated headings and visual descriptions have English, German, and Russian versions, including the no-JavaScript English fallback. The validation, language persistence, FAQ, inquiry generation, clipboard, and WhatsApp implementation in `assets/clinic.js` is unchanged. The existing browser regression suite was rerun against the redesign; it passed, including zero axe WCAG A/AA violations in all three languages at 320px and 1440px. Desktop/mobile screenshots were reviewed. This remains Phase 1; no later demo is implemented.
