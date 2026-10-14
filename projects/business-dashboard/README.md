# Ordelle — Business, in order

Phase 4 is a fictional small-business operations workspace: **Demo / Concept**, with 180 reproducible orders and 96 inquiries. It demonstrates how a service business could organize work, investigate performance, and keep operational views consistent. Meridian Studio and all records are fictional. No orders, payments, messages, or customer contact are processed.

## Run

No build, installation, backend, API, or runtime library is required. Serve the repository with Python 3 or any static server, then open `projects/business-dashboard/`. To verify the GitHub Pages prefix, serve the parent directory and request `/web-demos/projects/business-dashboard/`. All assets are relative and local. Direct links such as `#orders` and browser back/forward work without server rewrites.

## Product and design

A deep navy navigation rail anchors a cool-white workspace. Cobalt accents, restrained status colors, original SVG icons, generous spacing, readable financial figures, and native controls give the application its own identity. Mobile uses a modal navigation drawer, reorganized cards, and independently scrollable tables. There is no simulated network activity or decorative chart data.

- **Overview:** revenue, orders, pending fulfillment, open inquiries, average order value, recent records, revenue/volume trends, fulfillment distribution, and activity.
- **Orders:** live search; combined fulfillment/payment filters; date, amount, and customer sorting in both directions; pagination; detail dialog; permitted fulfillment edits with undo; full filtered CSV export, including records beyond the current page.
- **Inquiries:** search, status/channel/priority filters, date/customer/priority/status sorting, pagination, detail dialog, status and priority edits, and undo.
- **Analytics:** revenue and volume trends, fulfillment, channels, and inquiry resolution; all charts have textual legends or exact-value table alternatives.
- **Demo settings:** calculation rules, local-storage status, and a confirmed reset which preserves other applications' storage.

Every view uses the same reporting period: 7, 30, or 90 days ending **31 March 2026**. These are fixed sample dates, not a claim about current business activity. List filters narrow only their own list/export; the shared period controls every view.

## Data and calculation rules

`assets/mock-data.js` uses a fixed seeded generator. Amounts are integer USD cents; order amount is unit price × quantity. IDs are unique, customers are fictional company labels, and no personal contact details are collected.

`assets/analytics.js` contains pure search, combined filters, stable sorting, pagination, metrics, bucket aggregation, distributions, and CSV formatting:

- Revenue includes **paid orders whose fulfillment is not cancelled**. It is a demo operating metric, not an accounting ledger.
- Average order value uses those same eligible paid orders; zero eligible orders returns zero.
- Pending orders have pending fulfillment, independent of payment status.
- Open inquiries have `new` or `in-progress` status.
- Unpaid orders cannot become completed; refunded orders remain cancelled. Payment values are not editable.
- Trend buckets cover the selected period once, without overlaps or gaps. Revenue and count totals reconcile with the KPIs.
- Activity uses actual record creation dates or explicit local edits. It never invents live events.

Default 30-day data contains 61 orders, $23,942.00 eligible revenue, 19 pending orders, 23 open inquiries, and a $532.04 rounded average across 45 eligible paid orders. These values are documented for verification; the application calculates them at runtime.

## State and security

`assets/store.js` regenerates the base data and applies validated overrides from the versioned `ordelle.demo.v1` localStorage key. Only record statuses, inquiry priorities, reporting-period preference, and up to 40 edit events persist. Search, filters, pagination, and the single most recent undo action are session UI state.

Stored IDs, fields, enums, activity, schema version, and payment/fulfillment compatibility are validated before applying overrides. Malformed or incompatible state recovers to the original records with a notice. Blocked storage leaves all features usable in memory, with a session-only notice; edits cannot survive refresh in that case. Reset removes only Ordelle's key and restores the sample period, records, and filters. No secrets, credentials, real personal information, or server saves are involved.

`assets/app.js` renders with DOM creation and `textContent`, coordinates views and native dialogs, and redraws charts on resize. CSV downloads are generated locally, quote all fields, escape quotes/newlines, neutralize formula prefixes, label every record fictional, and preserve accurate amounts. No HTML is inserted from editable or stored values.

## Accessibility

Semantic landmarks, one page heading, labeled controls, visible keyboard focus, native modal focus containment/Escape, focus return after re-rendering, status announcements, table captions/headers, and non-color status labels are included. SVG trends have descriptions and expandable data tables; distribution charts have exact labeled counts. Reduced motion is respected. A no-JavaScript fallback explains the dataset and provides a portfolio link without claiming calculated results.

## Development tests

Development dependencies are optional and are not shipped to visitors. Install Playwright and axe-core outside the repository; point `NODE_PATH` to that installation. Use an installed Chromium with `CHROMIUM_PATH` (default `/usr/bin/chromium`). Start a static server on port 8000 from the repository's parent directory.

```sh
node --test projects/business-dashboard/tests/model.cjs
NODE_PATH=/path/to/qa/node_modules CHROMIUM_PATH=/usr/bin/chromium node projects/business-dashboard/tests/browser.cjs
```

Override `ORDELLE_TEST_URL` to test a different static server. The browser suite writes screenshots to `/tmp/ordelle-qa/`.

The model suite checks deterministic data, independent revenue rules, period/chart reconciliation, search/combined filters, both sort directions, pagination, transitions, undo, persistence, reset isolation, corrupted/blocked storage, and CSV escaping/formula injection. The browser suite covers all views at 320, 390, 600, 768, 950, 1024, 1440, and 1920px; axe scans at 320/390/1440; actual downloads; editing and cross-view recalculation; keyboard dialogs and focus return; history/skip navigation; mobile menus; reload/reset/recovery; zero revenue; blocked storage; reduced motion; no-JavaScript fallback; asset failures; and browser exceptions.

## Verified results

The nine model tests and full Chromium browser suite passed. All five views passed responsive overflow checks at eight widths; axe reported zero violations on those views at 320, 390, and 1440px. Detail/reset dialogs and the mobile drawer also passed automated accessibility checks. Desktop (1440 × 900), mobile, management tables, analytics, detail dialogs, and the portfolio preview were reviewed visually. Existing Avela, ORIVELA, ReplyGap, pricing/model, and portfolio regression checks passed; their implementations remain unchanged.

## Limitations

This is a single-browser concept, not a deployed operations service. There is no login, authorization, synchronization, real payment processing, accounting compliance, messaging, or multi-user conflict handling. Storage may be cleared by the browser. It does not include Phase 5. Automated Chromium/axe checks and screenshot review do not replace manual assistive-technology testing or real-device Safari/Firefox validation.
