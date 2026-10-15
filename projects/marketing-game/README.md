# VELUNE — Match / Reveal

Phase 5 is an original, fictional creative-commerce campaign: **Demo / Concept**. VELUNE's “Objects of wonder” collection becomes a memory-matching experience with eight original generated studio collectible images and a purely illustrative reward reveal. It demonstrates how a brand could introduce a collection through interaction, without claiming engagement results or collecting visitor information.

## Run locally

No installation, build, framework, backend, or runtime library is needed. Serve the repository with any static server and open `projects/marketing-game/`. To test GitHub Pages paths from the cloud checkout:

```sh
python3 -m http.server 8000 --bind 0.0.0.0 --directory /workspace
```

Request `/web-demos/projects/marketing-game/`. All assets are local and paths are relative. A local server is recommended; clipboard APIs require a supported secure context (HTTPS or localhost). If clipboard permission or support is unavailable, a labeled, selected input provides manual copying.

## Experience

- A midnight-plum campaign with warm off-white typography, lime highlights, lavender details, and layered card surfaces.
- A default 4 × 4 deck containing eight unique pairs: Bloom, Orbit, Ripple, Arc, Spark, Loop, Fold, and Vessel.
- First/second card selection, permanent matches, delayed mismatch resolution, accurate attempts, remaining pairs, and collection progress.
- Immediate restart, including during a pending mismatch; replay from completion.
- A sculptural collector-card reward reveal, working Copy Demo Code action, and honest manual-copy fallback.
- Original generated WebP art, CSS card flipping, and reduced-motion support. No sound, countdown, leaderboard, or speed requirement.
- Keyboard play, live announcements, native card buttons, visible focus, and a readable no-JavaScript campaign fallback.
- A “behind the campaign” section explaining the concept to potential brand clients.

The reward has **no monetary value and is not redeemable**. There is no purchase, coupon validation, prize fulfillment, or real-world promise. No account, personal data, analytics, tracking, storage, external API request, or external service is used. The game resets on a page reload; no personal-best data is persisted.

## Rebrand in one place

Edit **`GAME_CONFIG` at the very top of `assets/app.js`**. No rendering or state-machine changes are required for ordinary rebranding.

| Group                  | Changes                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand`                | Name, visible wordmark, tagline, and card-back monogram. Updates header/footer/card identity and document metadata.                            |
| `theme`                | Six-digit hex colors for background, surface, primary accent, secondary accent, text, and card face. Populates matching CSS custom properties. |
| `campaign`             | Campaign title, three headline lines, and introduction.                                                                                        |
| `game.pairs`           | `4`, `6`, or `8`; uses the first configured symbols in a four-column grid. Default: eight pairs.                                               |
| `game.mismatchDelayMs` | Integer from `300` to `3000`; default `950`. Controls the mismatch display time, not a player deadline.                                        |
| `symbols`              | Ordered `{ id, label, artwork }` entries from the eight original artwork IDs. Change labels or order to curate the collection.                 |
| `reward`               | Headline, description, and demonstration code. Keep it explicitly fictional and nonredeemable.                                                 |

For example, change `brand.logoText`, `brand.monogram`, `theme.primary`, and `reward.code` in that object to apply a new identity. Update brand-specific wording in `reward.description` in the same object as needed. Choose color combinations with sufficient text, focus, and card contrast, then rerun accessibility checks. Configuration validation checks color syntax; it cannot guarantee that an arbitrary client palette meets contrast requirements.

`normalizeConfig` validates the object without mutating it. Unsupported pair counts, out-of-range delays, missing or empty text, and unsafe CSS color values receive safe defaults. Text lengths are bounded; duplicate/unknown symbol IDs are removed and missing entries filled from the original collection. Configuration text is assigned with `textContent`, never injected as HTML.

The HTML contains generic readable fallback copy, and CSS supplies the default palette so the no-JavaScript campaign remains usable. Those fallbacks are not a second interactive configuration. The favicon is an original abstract campaign symbol. Artwork paths belong in `symbols[].artwork` (card and gallery) and `artwork.hero` / `artwork.reward`. Only `assets/art/<lowercase-slug>.webp` paths are accepted; remote, traversal, query and non-WebP paths receive safe local defaults. To replace an object, save its WebP locally and update the mapping. A missing file hides the broken image while keeping the object label and gameplay usable. Adding new game IDs requires extending the catalog; replacing artwork does not.

## Architecture and reliability

- **`game-logic.js`:** build-free browser/CommonJS module with configuration normalization, deck generation, Fisher–Yates shuffle, and pure game transitions. Shuffle uses cryptographic random integers with rejection sampling where available, avoiding modulo bias; the fallback is `Math.random` with uniform index scaling. Tests inject deterministic choices and enumerate every permutation of a three-item deck.
- **`app.js`:** the single configuration object followed by safe DOM rendering, keyboard navigation, live feedback, lifecycle handling, mismatch scheduling, and clipboard/reward interactions.
- **`index.html`:** semantic exhibition structure, local collectible imagery, progressive fallback, and inline reward section.
- **`style.css`:** responsive campaign system, dimensional cards, matched indicators, and reduced-motion overrides.

| State       | Allowed transition                                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `ready`     | A valid face-down card becomes the first selection.                                                                     |
| `first`     | A different face-down card increments attempts once. A pair becomes matched; otherwise the game enters `resolving`.     |
| `resolving` | Further card input is ignored. The scheduled resolution clears only the temporary selections.                           |
| `complete`  | Every pair is matched; further card input is ignored and the reward becomes available.                                  |
| Restart     | Creates a fresh shuffled deck, resets counters and reward/copy state, clears the timer, and advances the generation ID. |

Transitions return new state without mutating earlier state; rejected inputs return the existing state. Matched or already selected cards cannot be selected again. Timer callbacks and asynchronous clipboard results carry a generation ID, so an old callback cannot alter a restarted game. Page-hide cleanup cancels the timer; a back/forward-cache restoration resolves a previously pending mismatch safely.

## Accessibility and controls

Cards are native buttons with numbered face-down labels. A revealed label names the symbol; a matched label explicitly says “matched.” All visual artwork is hidden from assistive technology because its information is already in the button label. Matches, mismatches, progress, and completion are announced in a polite live region. Mismatch names remain in the status after the cards close, so feedback does not depend on catching a short visual animation.

Use **Tab** to reach cards, **Enter/Space** to reveal, **arrow keys** to move, and **Home/End** to jump to the first/last card. Matched cards stay focusable for review while `aria-disabled` and state guards prevent further moves. Completion focuses its heading; restart/replay focuses the first new card. The reward is inline, so no modal focus trap or Escape interaction is necessary. Reduced motion removes flips, entrance motion, and smooth scrolling without changing the rules. Touch targets for cards remain at least 44 × 44px at tested widths.

## Automated QA

Node tests need no dependencies:

```sh
node --test projects/marketing-game/tests/model.cjs
```

For browser tests, install Playwright and axe-core **outside the repository**, start the static server, and run:

```sh
NODE_PATH=/path/to/qa/node_modules CHROMIUM_PATH=/usr/bin/chromium \
  node projects/marketing-game/tests/browser.cjs
```

Override `MARKETING_GAME_TEST_URL` for a different server. Screenshots are written to `/tmp/velune-qa/`, not shipped as production assets.

The ten model tests cover deck/pair integrity, deterministic shuffle mechanics, all small-deck permutations, first/second selection, duplicate and rapid input, matching, mismatch locks, completion, restart isolation, configurable counts, and safe configuration defaults.

Browser checks cover 320, 375, 390, 768, 1024, 1440, and 1920px; initial and completed layouts; no page overflow; card touch sizes; accurate attempts/progress; restart during a pending timeout; real clipboard copying and denied-copy fallback; late clipboard results after restart; keyboard-only completion and focus; reduced motion; back/forward-cache recovery; one-object rebranding; invalid configuration and safe rendering; emulated touch; blocked storage; no-JavaScript content; relative paths; console errors; failed HTTP responses; and external requests. Axe scans initial and reward states at 320/390/1440, plus copy fallback and the rebranded configuration.

Desktop (1440 × 900), mobile campaign, and reward screenshots are reviewed for hierarchy, card legibility, spacing, and completion presentation. Previous portfolio and demo regression suites are run separately; their implementations remain unchanged.

## Verified results

All ten model tests and the complete Chromium browser suite passed. Initial and reward states passed axe checks at 320, 390, and 1440px, with zero reported violations; copy fallback and the rebranded configuration also passed. All seven requested widths passed overflow and card-size checks. Portfolio regression checks and the existing Avela, ORIVELA, ReplyGap, and Ordelle browser/model/pricing suites passed. The four previous project cards and demo implementations were verified unchanged against the branch base.

## Limitations

This is a static promotional concept, not a production rewards system. Cards and configuration are visible in source; there is no anti-cheating or server verification, and no real reward to protect. Only Chromium and emulated touch are covered by the automated browser suite. Manual screen-reader, Safari/Firefox, and physical-device reviews remain advisable before a real client launch. The repository-wide Phase 6 audit and its limitations are documented in ../../PORTFOLIO_AUDIT.md.

## Premium visual redesign

The compact campaign heading leads into an oversized chrome-flower exhibit and a portrait 4 × 4 deck. All sixteen cards fit in the initial 1440 × 900 desktop viewport. Engraved plum backs flip into full-image collectible faces; matched cards retain their artwork with a check and explicit collected label. The completion scene features a large champagne-metal knot card, reward ticket and copy controls. Mobile uses a compact exhibition banner above the touch-friendly deck; the complete collection remains available below.

Eight 384 × 384 WebP collectibles and two 960 × 960 hero/reward variants total **264,824 bytes**. The hero and game artwork load immediately; the gallery and reward use lazy loading. There are no full-resolution PNGs or remote image requests in the shipped page. See [art provenance](assets/art/PROVENANCE.md). Images depict fictional objects, not available products.

Additional image/configuration QA: `node projects/marketing-game/tests/artwork.cjs` with the same browser-test environment. This checks decoded images, local payload budget, full desktop board visibility, configuration remapping and missing-image fallback. Model tests also reject unsafe artwork paths. Desktop and mobile initial, revealed/matched and reward screenshots were compared with the preceding version. This is a composition and asset redesign; shuffle and game transition functions remain unchanged.
