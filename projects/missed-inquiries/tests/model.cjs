const test = require("node:test");
const assert = require("node:assert/strict");
const m = require("../assets/model.js");
const close = (actual, expected) =>
  assert(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);
const calc = (changes) => {
  const s = m.calculate({ ...m.defaults, ...changes });
  assert.equal(s.valid, true);
  return s.result;
};
test("documented defaults independently reconcile monthly and annual cents", () => {
  const r = calc({});
  assert.equal(r.potentialCents, 1500000);
  assert.equal(r.currentCents, 768000);
  assert.equal(r.missedCents, 732000);
  assert.equal(r.annualCents, 8784000);
  close(r.delayedRate, 0.128);
  close(r.missedConversions, 29.28);
  close(r.rateDifference, 12.2);
  assert.equal(r.doublings, 3);
});
test("responses from zero through five minutes have no delay penalty", () => {
  for (const minutes of [0, 1, 4, 5]) {
    const r = calc({ minutes });
    assert.equal(r.missedCents, 0);
    assert.equal(r.currentCents, 1500000);
    assert.equal(r.doublings, 0);
  }
});
test("independent doubling scenario: 200 × 25% × 400; retention .8 squared", () => {
  const r = calc({ inquiries: 200, conversion: 25, value: 400, minutes: 20 });
  assert.equal(r.potentialCents, 2000000);
  assert.equal(r.currentCents, 1280000);
  assert.equal(r.missedCents, 720000);
  close(r.missedConversions, 18);
});
test("fractional doubling uses the logarithm, not a rounded bucket", () => {
  const r = calc({ minutes: 15, retention: 50 });
  close(r.doublings, Math.log2(3));
  close(r.delayedRate, 1 / 12);
  assert.equal(r.currentCents, 500000);
  assert.equal(r.missedCents, 1000000);
});
test("zero inquiries clears every revenue and conversion count", () => {
  const r = calc({ inquiries: 0 });
  for (const key of [
    "potentialCents",
    "currentCents",
    "missedCents",
    "annualCents",
    "missedConversions",
  ])
    assert.equal(r[key], 0);
});
test("zero sale value keeps expected conversion difference but has zero revenue", () => {
  const r = calc({ value: 0 });
  assert.equal(r.missedCents, 0);
  assert.equal(r.potentialCents, 0);
  close(r.missedConversions, 29.28);
});
test("zero and complete baseline conversion are supported", () => {
  assert.equal(calc({ conversion: 0 }).annualCents, 0);
  assert.equal(calc({ conversion: 100, minutes: 5 }).currentCents, 6000000);
});
test("100% retention assumes no effect at any delay", () => {
  const r = calc({ retention: 100, minutes: 10080 });
  assert.equal(r.missedCents, 0);
  assert.equal(r.rateDifference, 0);
});
test("presets are retention-only assumptions with independent expected values", () => {
  assert.deepEqual(m.presets, {
    conservative: 90,
    moderate: 80,
    aggressive: 60,
  });
  for (const [retention, current] of [
    [90, 1093500],
    [80, 768000],
    [60, 324000],
  ])
    assert.equal(calc({ retention }).currentCents, current);
});
test("monotonic delay: every minute across seven days and every preset", () => {
  for (const retention of [1, 60, 80, 90, 100]) {
    let previous = 0;
    for (let minutes = 0; minutes <= 10080; minutes++) {
      const r = calc({ retention, minutes });
      assert(r.missedCents >= previous);
      previous = r.missedCents;
    }
  }
});
test("larger retention never increases the gap", () => {
  let previous = Infinity;
  for (let retention = 1; retention <= 100; retention++) {
    const r = calc({ retention });
    assert(r.missedCents <= previous);
    previous = r.missedCents;
  }
});
test("extremes stay finite, nonnegative and within safe integer cents", () => {
  for (const retention of [1, 100]) {
    const r = calc({
      inquiries: 100000,
      value: 1000000,
      conversion: 100,
      minutes: 10080,
      retention,
    });
    for (const value of Object.values(r))
      assert(Number.isFinite(value) && value >= 0);
    for (const key of [
      "potentialCents",
      "currentCents",
      "missedCents",
      "annualCents",
    ])
      assert(Number.isSafeInteger(r[key]));
    assert.equal(r.potentialCents, 10000000000000);
  }
});
test("cent rounding reconciles the displayed total before annualization", () => {
  const r = calc({
    inquiries: 1,
    value: 0.03,
    conversion: 50,
    minutes: 10,
    retention: 50,
  });
  assert.equal(r.potentialCents, 2);
  assert.equal(r.currentCents, 1);
  assert.equal(r.missedCents, 1);
  assert.equal(r.annualCents, 12);
});
test("currency selection formats the same amount without conversion", () => {
  assert.equal(m.money(732000, "USD"), "$7,320.00");
  assert.equal(m.money(732000, "EUR"), "€7,320.00");
  assert.equal(m.money(732000, "GBP"), "£7,320.00");
  assert.equal(m.money(0, "USD"), "$0.00");
  for (const currency of m.currencies)
    assert.equal(calc({ currency }).missedCents, 732000);
});
test("invalid, missing, empty, infinite and malformed values never yield results", () => {
  for (const key of Object.keys(m.fields)) {
    for (const value of [
      "",
      " ",
      null,
      undefined,
      NaN,
      Infinity,
      -1,
      "hello",
      "1e2",
      "0x10",
      [],
      [1],
      {},
      true,
    ]) {
      const s = m.calculate({ ...m.defaults, [key]: value });
      assert.equal(s.valid, false, `${key} ${String(value)}`);
      assert(s.errors[key]);
      assert.equal(s.result, null);
      assert.equal(m.summary({ ...m.defaults, [key]: value }), "");
    }
  }
  assert.equal(m.calculate(null).valid, false);
  assert.equal(m.calculate({}).valid, false);
});
test("field bounds and precision are enforced, not silently clamped", () => {
  for (const [key, value] of [
    ["inquiries", 100001],
    ["minutes", 10081],
    ["value", 1000000.01],
    ["conversion", 100.1],
    ["retention", 0],
    ["retention", 101],
    ["inquiries", 0.5],
    ["minutes", 5.5],
    ["value", 0.001],
    ["conversion", 25.05],
    ["retention", 80.1],
  ])
    assert.equal(m.calculate({ ...m.defaults, [key]: value }).valid, false);
});
test("currency validator and formatting reject unsupported or unsafe inputs", () => {
  assert.equal(m.calculate({ ...m.defaults, currency: "JPY" }).valid, false);
  for (const [amount, currency] of [
    [-1, "USD"],
    [NaN, "EUR"],
    [Infinity, "GBP"],
    [1.2, "USD"],
    [100, "ABC"],
  ])
    assert.throws(() => m.money(amount, currency), RangeError);
});
test("reset yields a fresh copy of immutable documented defaults", () => {
  const a = m.reset();
  a.inquiries = 0;
  a.currency = "EUR";
  assert.deepEqual(m.reset(), {
    inquiries: 240,
    minutes: 40,
    value: 250,
    conversion: 25,
    retention: 80,
    currency: "USD",
  });
  assert(Object.isFrozen(m.defaults));
});
test("curve samples are actual model results with correct endpoints", () => {
  const rows = m.curve(m.defaults);
  assert.equal(rows[0].minutes, 0);
  assert.equal(rows.at(-1).minutes, 10080);
  for (const row of rows)
    assert.deepEqual(row, {
      minutes: row.minutes,
      ...calc({ minutes: row.minutes }),
    });
  assert.deepEqual(m.curve({}), []);
});
test("English summary contains inputs, units, formula, exact totals and disclaimer", () => {
  const s = m.summary(m.defaults);
  for (const text of [
    "240",
    "40 minutes",
    "$250.00",
    "80%",
    "$7,320.00",
    "$87,840.00",
    "USD",
    "12 identical months",
    "P × R^D",
    "not research findings",
    "Inputs are not submitted",
  ])
    assert(s.includes(text), text);
});
