# Ege Sarp Yazıcı — Portfolio foundation

A lightweight, original portfolio for independent web development. Phase 0 presents the developer’s services and approach. Phase 1 adds **Avela**, a complete multilingual clinic website demo, alongside four **Coming Soon — Demo / Concept** previews. All projects are original concepts, not commissioned client case studies.

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

Request `/web-demos/` on port 8000. HTML, CSS, JavaScript, and SVG assets are served directly. The site can also be opened from `index.html`; a local server is recommended for QA. Python is a development convenience, not a hosting dependency.

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
projects/tour-rental/        Reserved tour and rental demo
projects/missed-inquiries/   Reserved inquiries calculator
projects/business-dashboard/ Reserved business dashboard
projects/marketing-game/    Reserved branded mini-game
AGENTS.md                   Permanent standards for future Codex tasks
.nojekyll                   Static GitHub Pages hosting
```

## Design and accessibility

Warm ivory, deep green ink, chartreuse accents, system sans-serif type, and italic serif headings establish an editorial identity. Original CSS/SVG previews explore distinct healthcare, travel, business-tool, dashboard, and game directions without stock imagery or external requests.

The page includes semantic landmarks, logical headings, a keyboard skip link, visible focus indicators, a mobile disclosure menu with Escape/focus handling, responsive layouts from 320px, and reduced-motion support. Decorative previews are hidden from assistive technology. Content and navigation remain available without JavaScript. The clinic card links to its standalone demo and source code. The other four cards remain noninteractive until their demos exist.

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
- **Future:** Tour & rental website — distinct travel discovery and rental interactions.
- **Future:** Missed inquiries calculator — accessible inputs, transparent assumptions, useful estimates.
- **Future:** Business dashboard — representative labeled sample data and meaningful controls.
- **Future:** Branded marketing mini-game — original interaction, keyboard support, accessible alternative.

Each demo requires its own scoped implementation and testing. Add navigation to a demo only after its standalone page is complete. Only the foundation and Phase 1 clinic are implemented. Phase 2 has not begun.

## Phase 1: Avela clinic demo

Open `projects/clinic/` through the static server. Avela uses an original warm healthcare identity, local SVG/CSS illustrations, and fully translated English, German, and Russian content. It demonstrates how a healthcare business could communicate services and guide international visitors toward a structured inquiry.

The inquiry builder validates sample details, formats dates locally, generates a reviewable summary, and supports copying. Nothing is booked, submitted, or received. WhatsApp is intentionally unconfigured; add a real authorized number only in `projects/clinic/assets/config.js`. No form data is persisted. Only the language preference is saved locally when storage is available.

See [the clinic documentation](projects/clinic/README.md) for configuration, business value, field rules, privacy behavior, browser testing instructions, and limitations. The committed `projects/clinic/tests/browser.cjs` suite checks languages, responsive layouts, navigation, form behavior, clipboard, WhatsApp configuration, and accessibility. Test dependencies are installed outside the repository and are not runtime dependencies.
