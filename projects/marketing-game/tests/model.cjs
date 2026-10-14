const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../assets/game-logic.js");
const symbols = L.catalog;
const fixed = (max) => max - 1;
function pair(state, symbol) {
  const [a, b] = state.deck.filter((c) => c.symbol === symbol);
  return L.select(L.select(state, a.id), b.id);
}
test("deck contains eight unique symbols, two cards each and unique IDs", () => {
  const s = L.create(symbols, fixed);
  assert.equal(s.deck.length, 16);
  assert.equal(new Set(s.deck.map((c) => c.id)).size, 16);
  for (const symbol of symbols)
    assert.equal(s.deck.filter((c) => c.symbol === symbol).length, 2);
  assert.equal(s.phase, "ready");
  assert.equal(s.moves, 0);
  for (const invalid of [[], ["not-a-symbol"], ["bloom", "bloom"]])
    assert.throws(() => L.create(invalid));
});
test("Fisher–Yates uses decreasing ranges, preserves input, and reaches all six permutations", () => {
  const values = [1, 2, 3],
    seen = new Set();
  for (let first = 0; first < 3; first++)
    for (let second = 0; second < 2; second++) {
      const picks = [first, second],
        ranges = [];
      seen.add(
        L.shuffle(values, (max) => {
          ranges.push(max);
          return picks.shift();
        }).join(","),
      );
      assert.deepEqual(ranges, [3, 2]);
    }
  assert.equal(seen.size, 6);
  assert.deepEqual(values, [1, 2, 3]);
  assert.deepEqual(
    L.shuffle(values, () => 0),
    [2, 3, 1],
  );
  assert.throws(() => L.shuffle(values, () => 3));
  for (let i = 0; i < 50; i++) {
    const n = L.randomIndex(7);
    assert(Number.isInteger(n) && n >= 0 && n < 7);
  }
});
test("first reveal and duplicate/invalid selections do not increment attempts", () => {
  const initial = L.create(symbols, fixed),
    first = L.select(initial, "bloom-a");
  assert.equal(first.phase, "first");
  assert.equal(first.moves, 0);
  assert.deepEqual(first.selected, ["bloom-a"]);
  assert.equal(L.select(first, "bloom-a"), first);
  assert.equal(L.select(first, "missing"), first);
  assert.deepEqual(initial.selected, []);
});
test("a matching second selection adds one attempt and permanently reveals the pair", () => {
  const s = pair(L.create(symbols, fixed), "bloom");
  assert.equal(s.moves, 1);
  assert.equal(s.phase, "ready");
  assert.deepEqual(s.selected, []);
  assert.deepEqual(s.matched, ["bloom-a", "bloom-b"]);
  assert.equal(L.select(s, "bloom-b"), s);
  assert.equal(L.resolve(s), s);
});
test("mismatch locks all further selections until explicit resolution", () => {
  let s = L.select(L.select(L.create(symbols, fixed), "bloom-a"), "orbit-a");
  assert.equal(s.phase, "resolving");
  assert.equal(s.moves, 1);
  assert.equal(s.matched.length, 0);
  for (let i = 0; i < 50; i++) assert.equal(L.select(s, s.deck[i % 16].id), s);
  const ready = L.resolve(s);
  assert.equal(ready.phase, "ready");
  assert.deepEqual(ready.selected, []);
  assert.equal(ready.moves, 1);
  assert.equal(s.phase, "resolving");
});
test("complete detection occurs only at the last pair and further input is inert", () => {
  let s = L.create(symbols, fixed);
  for (let i = 0; i < symbols.length; i++) {
    s = pair(s, symbols[i]);
    assert.equal(s.phase, i === 7 ? "complete" : "ready");
    assert.equal(s.moves, i + 1);
  }
  assert.equal(s.matched.length, 16);
  assert.equal(L.select(s, "bloom-a"), s);
  assert.equal(L.resolve(s), s);
});
test("new games reset selected/matched/moves and do not mutate the previous game", () => {
  const previous = L.select(pair(L.create(symbols, fixed), "bloom"), "orbit-a");
  const next = L.create(symbols, () => 0);
  assert.equal(next.moves, 0);
  assert.equal(next.matched.length, 0);
  assert.equal(next.selected.length, 0);
  assert.equal(previous.moves, 1);
  assert.deepEqual(previous.selected, ["orbit-a"]);
  assert.notDeepEqual(previous.deck, next.deck);
});
test("four/six/eight pair configuration and pure safe fallbacks", () => {
  for (const pairs of [4, 6, 8]) {
    const c = L.normalizeConfig({
      game: { pairs, mismatchDelayMs: 300 },
      symbols: [
        { id: "spark", label: "Prism" },
        { id: "spark", label: "duplicate" },
        { id: "unknown", label: "bad" },
      ],
    });
    assert.equal(c.symbols.length, pairs);
    assert.equal(c.symbols[0].label, "Prism");
    assert.equal(new Set(c.symbols.map((s) => s.id)).size, pairs);
    assert.equal(L.create(c.symbols.map((s) => s.id)).deck.length, pairs * 2);
    assert.equal(c.game.mismatchDelayMs, 300);
  }
  const c = L.normalizeConfig({
    brand: { name: " ", monogram: "TOO LONG" },
    theme: { primary: "url(https://example.com)", accent: "#abcdef" },
    game: { pairs: 3, mismatchDelayMs: Infinity },
    symbols: null,
    reward: { code: 123 },
  });
  assert.equal(c.brand.name, "Studio");
  assert.equal(c.brand.monogram, "TOO");
  assert.equal(c.theme.primary, "#dcf594");
  assert.equal(c.theme.accent, "#abcdef");
  assert.equal(c.game.pairs, 8);
  assert.equal(c.game.mismatchDelayMs, 950);
  assert.equal(c.reward.code, "STUDIO-DEMO");
  assert.equal(L.normalizeConfig(null).symbols.length, 8);
  assert.equal(
    L.normalizeConfig({ theme: { text: 123 } }).theme.text,
    "#f5f1e9",
  );
});
test("brand, campaign, card theme and reward are copied independently from configuration", () => {
  const input = {
    brand: {
      name: "Aurel",
      logoText: "AUREL",
      tagline: "Objects for tomorrow",
      monogram: "A",
    },
    theme: {
      background: "#101820",
      surface: "#253444",
      primary: "#e3eeaa",
      accent: "#d2c3ef",
      text: "#ffffff",
      card: "#f0ebdf",
    },
    campaign: {
      title: "Find / Keep",
      firstLine: "Make space",
      secondLine: "for a",
      finalLine: "moment.",
    },
    reward: {
      headline: "Made for discovery.",
      description: "A fictional keepsake.",
      code: "AUREL-DEMO",
    },
  };
  const copy = JSON.stringify(input),
    c = L.normalizeConfig(input);
  assert.deepEqual(c.brand, input.brand);
  assert.deepEqual(c.theme, input.theme);
  assert.deepEqual(c.reward, input.reward);
  assert.equal(c.campaign.title, "Find / Keep");
  assert.equal(JSON.stringify(input), copy);
});
