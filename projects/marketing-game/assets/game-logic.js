/* Pure configuration and game transitions. CommonJS exports support build-free tests. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.MatchGame = factory();
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const catalog = [
    "bloom",
    "orbit",
    "ripple",
    "arc",
    "spark",
    "loop",
    "fold",
    "vessel",
  ];
  const defaults = {
    brand: {
      name: "Studio",
      logoText: "STUDIO",
      tagline: "Objects of wonder",
      monogram: "S",
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
        "A small pause. A little discovery. Match the collection and reveal a thoughtful finishing touch.",
    },
    game: { pairs: 8, mismatchDelayMs: 950 },
    reward: {
      headline: "A little wonder, revealed.",
      description:
        "An illustrative invitation to discover the collection. This code is a portfolio demonstration only.",
      code: "STUDIO-DEMO",
    },
  };
  function text(value, fallback, max = 100) {
    return typeof value === "string" && value.trim()
      ? value.trim().slice(0, max)
      : fallback;
  }
  function normalizeConfig(input = {}) {
    if (!input || typeof input !== "object") input = {};
    const result = {};
    for (const group of ["brand", "campaign", "reward"]) {
      result[group] = {};
      for (const [key, fallback] of Object.entries(defaults[group])) {
        const limit =
          key === "description"
            ? 260
            : key === "monogram"
              ? 3
              : key === "logoText"
                ? 16
                : key === "code"
                  ? 40
                  : key === "name"
                    ? 40
                    : 80;
        result[group][key] = text(input[group]?.[key], fallback, limit);
      }
    }
    result.theme = {};
    for (const [key, fallback] of Object.entries(defaults.theme))
      result.theme[key] = /^#[0-9a-f]{6}$/i.test(input.theme?.[key])
        ? input.theme[key]
        : fallback;
    result.game = {
      pairs: [4, 6, 8].includes(input.game?.pairs) ? input.game.pairs : 8,
      mismatchDelayMs:
        Number.isInteger(input.game?.mismatchDelayMs) &&
        input.game.mismatchDelayMs >= 300 &&
        input.game.mismatchDelayMs <= 3000
          ? input.game.mismatchDelayMs
          : defaults.game.mismatchDelayMs,
    };
    const seen = new Set();
    result.symbols = (Array.isArray(input.symbols) ? input.symbols : [])
      .filter((s) => {
        if (!s || !catalog.includes(s.id) || seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .map((s) => ({ id: s.id, label: text(s.label, s.id, 24) }));
    for (const id of catalog)
      if (!seen.has(id))
        result.symbols.push({ id, label: id[0].toUpperCase() + id.slice(1) });
    result.symbols = result.symbols.slice(0, result.game.pairs);
    return result;
  }
  // Rejection sampling avoids modulo bias when cryptographic randomness is available.
  function randomIndex(max) {
    if (globalThis.crypto?.getRandomValues) {
      const limit = Math.floor(4294967296 / max) * max;
      const value = new Uint32Array(1);
      do {
        globalThis.crypto.getRandomValues(value);
      } while (value[0] >= limit);
      return value[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
  function shuffle(values, choose = randomIndex) {
    const copy = [...values];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = choose(i + 1);
      if (!Number.isInteger(j) || j < 0 || j > i)
        throw Error("Invalid shuffle index");
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function create(symbols, choose) {
    if (
      !Array.isArray(symbols) ||
      symbols.length < 1 ||
      symbols.length > 8 ||
      new Set(symbols).size !== symbols.length ||
      symbols.some((s) => !catalog.includes(s))
    )
      throw Error("Invalid symbols");
    const deck = shuffle(
      symbols.flatMap((symbol) => [
        { id: symbol + "-a", symbol },
        { id: symbol + "-b", symbol },
      ]),
      choose,
    );
    return { phase: "ready", deck, selected: [], matched: [], moves: 0 };
  }
  function select(state, id) {
    if (
      state.phase === "resolving" ||
      state.phase === "complete" ||
      !state.deck.some((c) => c.id === id) ||
      state.selected.includes(id) ||
      state.matched.includes(id)
    )
      return state;
    if (!state.selected.length)
      return { ...state, phase: "first", selected: [id] };
    const first = state.deck.find((c) => c.id === state.selected[0]);
    const second = state.deck.find((c) => c.id === id);
    const selected = [...state.selected, id];
    const moves = state.moves + 1;
    if (first.symbol !== second.symbol)
      return { ...state, phase: "resolving", selected, moves };
    const matched = [...state.matched, ...selected];
    return {
      ...state,
      phase: matched.length === state.deck.length ? "complete" : "ready",
      selected: [],
      matched,
      moves,
    };
  }
  function resolve(state) {
    return state.phase === "resolving"
      ? { ...state, phase: "ready", selected: [] }
      : state;
  }
  return {
    catalog,
    normalizeConfig,
    randomIndex,
    shuffle,
    create,
    select,
    resolve,
  };
});
