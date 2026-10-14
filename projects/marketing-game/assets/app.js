/* Rebrand here. Use six-digit hex colors; supported pair counts: 4, 6, 8.
   Symbol IDs reference the original SVG collection in index.html. No real reward. */
const GAME_CONFIG = {
  brand: {
    name: "Velune",
    logoText: "VELUNE",
    tagline: "Objects of wonder",
    monogram: "V",
  },
  theme: {
    background: "#211b29",
    surface: "#302738",
    primary: "#dcf594",
    accent: "#cebaed",
    text: "#f5f1e9",
    card: "#ede6db",
  },
  campaign: {
    title: "Match / Reveal",
    firstLine: "Good things",
    secondLine: "come in",
    finalLine: "pairs.",
    description:
      "For the curious. The collectors. The just-one-more-try kind. Discover a collection of small wonders, two at a time.",
  },
  game: { pairs: 8, mismatchDelayMs: 950 },
  symbols: [
    { id: "bloom", label: "Bloom" },
    { id: "orbit", label: "Orbit" },
    { id: "ripple", label: "Ripple" },
    { id: "arc", label: "Arc" },
    { id: "spark", label: "Spark" },
    { id: "loop", label: "Loop" },
    { id: "fold", label: "Fold" },
    { id: "vessel", label: "Vessel" },
  ],
  reward: {
    headline: "A little wonder, revealed.",
    description:
      "Your collection is complete. Here is an imaginary invitation to the next chapter of Velune. A keepsake from this concept, with no real-world value.",
    code: "VELUNE-DEMO",
  },
};

(function () {
  "use strict";
  const L = window.MatchGame,
    config = L.normalizeConfig(GAME_CONFIG);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const node = (tag, className, content) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (content !== undefined) e.textContent = content;
    return e;
  };
  const labels = Object.fromEntries(config.symbols.map((s) => [s.id, s.label]));
  const root = document.documentElement;
  for (const [key, value] of Object.entries(config.theme))
    root.style.setProperty("--" + key, value);
  for (const group of ["brand", "campaign", "reward"])
    for (const [key, value] of Object.entries(config[group]))
      $$(`[data-${group}="${key}"]`).forEach((e) => (e.textContent = value));
  document.title = `${config.brand.name} — ${config.campaign.title} · Demo / Concept`;
  document.querySelector('meta[name="theme-color"]').content =
    config.theme.background;
  document.querySelector('meta[name="description"]').content =
    `${config.brand.name}: a fictional ${config.campaign.title} memory campaign. No purchases, tracking, or redeemable reward.`;
  $$("[data-pairs]").forEach((e) => (e.textContent = config.game.pairs));
  $("#collection-count").textContent = String(config.game.pairs).padStart(
    2,
    "0",
  );
  $("#progress").max = config.game.pairs;
  $("#game-shell").hidden = false;
  $("#play-link").hidden = false;
  $("#static-art").hidden = true;
  let state,
    timer = null,
    generation = 0,
    copying = false;
  const cards = new Map();
  function announce(message) {
    $("#game-status").textContent = message;
  }
  function makeCard(card, index) {
    const button = node("button", "card");
    button.type = "button";
    button.dataset.card = card.id;
    const turn = node("span", "card-turn");
    turn.setAttribute("aria-hidden", "true");
    const back = node("span", "card-side card-back");
    const corner = node(
      "span",
      "card-corner",
      String(index + 1).padStart(2, "0"),
    );
    const seal = node("span", "card-seal", config.brand.monogram);
    back.append(
      corner,
      seal,
      node("span", "card-edition", config.brand.logoText),
    );
    const face = node("span", "card-side card-face");
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 100");
    const use = document.createElementNS(svg.namespaceURI, "use");
    use.setAttribute("href", "#symbol-" + card.symbol);
    svg.append(use);
    face.append(
      svg,
      node("span", "symbol-name", labels[card.symbol]),
      node("span", "match-mark", "✓"),
    );
    turn.append(back, face);
    button.append(turn);
    button.addEventListener("click", () => pick(card.id));
    button.addEventListener("keydown", (event) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 4, ArrowUp: -4 };
      let target;
      if (Object.hasOwn(keys, event.key))
        target =
          (index + keys[event.key] + state.deck.length) % state.deck.length;
      else if (event.key === "Home") target = 0;
      else if (event.key === "End") target = state.deck.length - 1;
      if (target !== undefined) {
        event.preventDefault();
        cards.get(state.deck[target].id).focus();
      }
    });
    cards.set(card.id, button);
    return button;
  }
  function render() {
    state.deck.forEach((card, index) => {
      const button = cards.get(card.id),
        matched = state.matched.includes(card.id),
        face = matched || state.selected.includes(card.id);
      button.classList.toggle("is-revealed", face);
      button.classList.toggle("is-matched", matched);
      button.setAttribute(
        "aria-label",
        `Card ${index + 1} of ${state.deck.length}: ${face ? labels[card.symbol] + (matched ? ", matched" : ", revealed") : "face down"}`,
      );
      button.setAttribute(
        "aria-disabled",
        String(
          matched ||
            state.selected.includes(card.id) ||
            state.phase === "resolving" ||
            state.phase === "complete",
        ),
      );
    });
    const matched = state.matched.length / 2;
    $("#moves").textContent = state.moves;
    $("#matched").textContent = matched;
    $("#remaining").textContent = config.game.pairs - matched;
    $("#progress").value = matched;
    $("#progress").setAttribute(
      "aria-valuetext",
      `${matched} of ${config.game.pairs} pairs matched`,
    );
    $("#board").dataset.phase = state.phase;
  }
  function pick(id) {
    const previous = state;
    state = L.select(state, id);
    if (state === previous) return;
    render();
    const symbol = labels[state.deck.find((c) => c.id === id).symbol];
    if (state.phase === "first")
      announce(`${symbol} revealed. Choose a second card.`);
    else if (state.phase === "resolving") {
      const first =
        labels[state.deck.find((c) => c.id === state.selected[0]).symbol];
      announce(
        `${first} and ${symbol}. Not a match. The cards will turn back.`,
      );
      const current = generation;
      timer = window.setTimeout(() => {
        if (current !== generation) return;
        timer = null;
        state = L.resolve(state);
        render();
        announce(
          `${first} and ${symbol} did not match. ${config.game.pairs - state.matched.length / 2} pairs remaining.`,
        );
      }, config.game.mismatchDelayMs);
    } else if (state.phase === "complete") {
      announce(
        `Collection complete in ${state.moves} attempts. Your fictional reward is revealed below.`,
      );
      $("#reward").hidden = false;
      $("#reward-attempts").textContent = state.moves;
      $("#reward-title").focus({ preventScroll: true });
      $("#reward").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "center",
      });
    } else
      announce(
        `${symbol} pair matched. ${state.matched.length / 2} of ${config.game.pairs} pairs found.`,
      );
  }
  function restart(focus = true) {
    generation++;
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
    copying = false;
    state = L.create(config.symbols.map((s) => s.id));
    cards.clear();
    $("#board").replaceChildren(...state.deck.map(makeCard));
    $("#reward").hidden = true;
    $("#copy-status").textContent = "";
    $("#manual-copy").hidden = true;
    $("#copy-code").disabled = false;
    render();
    announce(
      `A fresh collection. Find ${config.game.pairs} pairs. No time limit.`,
    );
    if (focus) cards.get(state.deck[0].id).focus({ preventScroll: true });
  }
  $("#restart").addEventListener("click", () => restart());
  $("#play-again").addEventListener("click", () => {
    restart();
    $("#play").scrollIntoView({ behavior: "instant", block: "start" });
  });
  $("#play-link").addEventListener("click", (event) => {
    event.preventDefault();
    history.pushState(null, "", "#play");
    cards.get(state.deck[0].id).focus({ preventScroll: true });
    $("#play").scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "start",
    });
  });
  $("#copy-code").addEventListener("click", async () => {
    if (copying || state.phase !== "complete") return;
    const current = generation;
    copying = true;
    $("#copy-code").disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Clipboard unavailable");
      await navigator.clipboard.writeText(config.reward.code);
      if (current === generation)
        $("#copy-status").textContent =
          "Demo code copied. It is not redeemable.";
    } catch {
      if (current === generation) {
        $("#manual-copy").hidden = false;
        $("#copy-field").value = config.reward.code;
        $("#copy-status").textContent =
          "Automatic copying is unavailable. Select and copy the demo code below.";
        $("#copy-field").focus();
        $("#copy-field").select();
      }
    } finally {
      if (current === generation) {
        copying = false;
        $("#copy-code").disabled = false;
      }
    }
  });
  window.addEventListener("pagehide", () => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  });
  // A back/forward cache restore must not leave a cancelled mismatch locked.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted && state.phase === "resolving") {
      state = L.resolve(state);
      render();
      announce("Choose another pair. Your collection is still here.");
    }
  });
  restart(false);
})();
