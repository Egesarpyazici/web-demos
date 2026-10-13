# Portfolio development standards

## Mission and scope

Build an exceptional, premium freelance developer portfolio for small businesses, entrepreneurs, and startups in the US, UK, Germany, and Europe. All visible copy must be professional English. Preserve the established editorial identity, considered spacing, original graphics, and excellent mobile experience.

Phase 0 is the portfolio foundation only. Five future demos have reserved directories: clinic, tour-rental, missed-inquiries, business-dashboard, and marketing-game. Build those only when a subsequent task explicitly requests them. Each future demo should have its own distinct design and standalone index.html.

## Engineering

- Use semantic HTML5, CSS3, and vanilla JavaScript. No framework, backend, database, build pipeline, external runtime dependency, API, paid asset, or unlicensed imagery.
- Use original CSS and SVG artwork and system fonts. Keep assets lightweight and locally hosted.
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

- Clearly label unfinished projects “Coming Soon — Demo / Concept”. Do not link project directories until a tested standalone page exists.
- Previews are original visual studies, not completed applications or commissioned work. Mockup figures are illustrative, never portfolio performance claims.
- Never invent testimonials, clients, revenue outcomes, credentials, years of experience, or availability claims.
- Contact information belongs in assets/config.js. Empty contact fields must remain an explicit noninteractive status, not fake mail or social links. Only publish real details supplied by the owner.

## GitHub Pages

- The site is hosted under /web-demos/. Use relative asset and project paths, never root-relative /assets/ or /projects/ links.
- Preserve .nojekyll. No server-side routing or rewrite rules. Future demos must work when loaded directly.
- Run from the parent directory to validate the project prefix: python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace.

## Definition of done for subsequent tasks

Inspect the result in a real browser, including 320px, tablet, and desktop. Test navigation, keyboard focus, responsive menus, all new interactions, reduced motion, and no-JavaScript fallback. Check console errors, failed requests, broken internal links, overflow, and accessibility. Update README.md with actual behavior, configuration, roadmap, and known limitations. Do not claim checks that were not executed. Make a descriptive commit when requested, and clearly report PR/publication status.
