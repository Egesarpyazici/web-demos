# Portfolio development standards

## Mission and scope

Build an exceptional, premium freelance developer portfolio for small businesses, entrepreneurs, and startups in the US, UK, Germany, and Europe. All visible copy must be professional English. Preserve the established editorial identity, considered spacing, original graphics, and excellent mobile experience.

The portfolio and all five standalone demos are implemented: Avela (clinic), ORIVELA (tour-rental), ReplyGap (missed-inquiries), Ordelle (business-dashboard), and VELUNE (marketing-game). Preserve their approved, distinct visual identities and existing functionality. Maintenance should fix reproducible defects, not redesign projects or add phases without an explicit request. See PORTFOLIO_AUDIT.md for the latest audit scope and remaining owner actions.

## Engineering

- Use semantic HTML5, CSS3, and vanilla JavaScript. No framework, backend, database, build pipeline, external runtime dependency, API, paid asset, or unlicensed imagery.
- Use system fonts and original local CSS/SVG artwork or the approved generated WebP assets. Preserve the dental implant, yacht photography and collectible art; document provenance for new generated assets. Keep assets lightweight and locally hosted.
- Separate content (index.html), presentation (assets/styles.css), behavior (assets/main.js), and public contact configuration (assets/config.js).
- Favor progressive enhancement: content and navigation must remain usable without JavaScript.
- Write readable, maintainable code. Validate configuration and use DOM textContent rather than injecting HTML from configuration.
- Never put secrets in this public static repository.
- Preserve existing work. Inspect git status and applicable instructions before editing.
- Cloud tasks already run in isolated environments. Use the existing checkout; do not create a Git worktree unless explicitly requested.

## Accessibility and responsiveness

- Support 320px through large desktop widths without horizontal overflow, clipped content, or overlapping controls.
- Maintain landmarks, a single h1, logical headings, descriptive link text, and appropriate accessible names.
- All functional controls must work by keyboard and show visible focus. Preserve the skip link and menu focus handling, aria-expanded, Escape behavior, and resize reset.
- Aim for WCAG 2.2 AA contrast. Never convey meaning by color alone. Keep essential copy comfortably readable; miniature mockup details are decorative, not functional controls.
- Hide decorative artwork from assistive technology; give meaningful illustrations a concise accessible description.
- Honor prefers-reduced-motion. Do not introduce essential animation, autoplay, or flashing.
- Do not add fake buttons, dead anchors, inaccessible custom widgets, or misleading affordances.

## Honesty and contact

- All five current projects must remain linked and labeled “Live Demo — Concept”. Reserve “Coming Soon — Demo / Concept” only for genuinely unfinished future work.
- Previews represent working static demos, not commissioned work or real business services. Mockup figures and generated imagery are illustrative, never portfolio performance claims.
- Never invent testimonials, clients, revenue outcomes, credentials, years of experience, or availability claims.
- Contact information belongs in assets/config.js. Empty contact fields must remain an explicit noninteractive status, not fake mail or social links. Only publish real details supplied by the owner.

## GitHub Pages

- The site is hosted under /web-demos/. Use relative asset and project paths, never root-relative /assets/ or /projects/ links.
- Preserve .nojekyll. No server-side routing or rewrite rules. Every demo must work when loaded directly.
- Run from the parent directory to validate the project prefix: python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace.

## Definition of done for subsequent tasks

Inspect the result in a real browser, including 320px, tablet, and desktop. Test navigation, keyboard focus, responsive menus, all new interactions, reduced motion, and no-JavaScript fallback. Check console errors, failed requests, broken internal links, overflow, and accessibility. Update README.md with actual behavior, configuration, roadmap, and known limitations. Do not claim checks that were not executed. Make a descriptive commit when requested, and clearly report PR/publication status.

## Maintenance and release checks

- Read the relevant project README before modifying its model or configuration. Preserve EN/DE/RU translations, date/pricing rules, hypothetical-calculator disclosures, dashboard data reconciliation, and game timer/state guards.
- Start the server with the `/web-demos/` prefix above. Install Playwright and axe-core outside the repository, then run `NODE_PATH=/path/to/qa/node_modules CHROMIUM_PATH=/path/to/chromium node tests/run.cjs`. The runner fails on the first failed suite; screenshots/results belong in `/tmp`, never production assets.
- Audit all six pages at 320, 375, 390, 430, 768, 1024, 1440 and 1920px. Check landscape, keyboard use, reduced motion, no-JavaScript fallbacks and automated accessibility. Treat automated scans as partial evidence, not full WCAG certification.
- Maintain unique titles/descriptions, correct project-site canonical/Open Graph URLs, and sitemap.xml when routes change. Clinic metadata must follow language switching, VELUNE metadata must follow GAME_CONFIG branding, and Ordelle metadata must follow view changes.
- Keep assets/config.js as the sole portfolio contact configuration. The verified GitHub profile is configured; email and LinkedIn require real owner-supplied values. Never infer email from a username. Do not configure fictional demo WhatsApp destinations as real contacts.
- Preserve approved assets and no-build architecture. Do not add node_modules, package lockfiles, Lighthouse output, browser traces or screenshots to the deployed repository.
- Review diffs, run relevant tests and document exact evidence. Fetch main before creating a requested release branch. Push only when authorized, verify the remote SHA, and report PR/compare status. Do not merge or deploy without owner approval.
