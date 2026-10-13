const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const context = { window: {} };
vm.runInNewContext(
  fs.readFileSync(require.resolve("../assets/config.js"), "utf8"),
  context,
);
const config = context.window.ORIVELA_CONFIG;
const { calculate, dayNumber, offsetDay } = require("../assets/pricing.js");
const today = "2026-03-20";
const base = {
  package: "coast",
  start: "2026-03-28",
  end: "2026-03-28",
  guests: "6",
  option: "islands",
  extras: [],
};
let count = 0;
function total(changes, expected) {
  const result = calculate({ ...base, ...changes }, config, today);
  assert.equal(result.valid, true);
  assert.equal(result.total, expected);
  assert(
    result.lines.every((l) => Number.isSafeInteger(l.amount) && l.amount >= 0),
  );
  count++;
}
function invalid(changes, key) {
  const result = calculate({ ...base, ...changes }, config, today);
  assert.equal(result.valid, false);
  assert(result.errors[key]);
  assert.equal(result.total, null);
  assert.equal(result.lines.length, 0);
  count++;
}
total({}, 120000);
total(
  {
    end: "2026-03-30",
    guests: "8",
    option: "coves",
    extras: ["host", "tasting", "paddle", "transfer"],
  },
  694000,
);
total(
  {
    package: "sunset",
    end: "2026-03-29",
    guests: "6",
    option: "extended",
    extras: ["host", "tasting"],
  },
  330000,
);
total(
  {
    package: "signature",
    end: "2026-04-03",
    guests: "12",
    option: "sail",
    extras: ["host", "tasting", "paddle", "transfer"],
  },
  2473000,
);
total({ guests: "1" }, 120000);
total({ start: "2027-03-20", end: "2027-03-20" }, 120000);
for (const start of ["", "2026-02-30", "2026-03-20", "2027-03-21", "2026-3-28"])
  invalid({ start }, "start");
for (const end of ["", "2026-03-27", "2026-04-04", "2027-03-21"])
  invalid({ end }, "end");
for (const guests of ["", 0, -1, 1.5, "NaN", "Infinity", "1e1", 11])
  invalid({ guests }, "guests");
invalid({ package: "sunset", guests: 9, option: "classic" }, "guests");
invalid({ package: "signature", guests: 13, option: "motor" }, "guests");
invalid({ package: "__proto__" }, "package");
invalid({ option: "bad" }, "option");
invalid({ extras: ["host", "host"] }, "extras");
invalid({ extras: ["bad"] }, "extras");
invalid({ extras: null }, "extras");
assert.equal(dayNumber("2026-02-29"), null);
assert.notEqual(dayNumber("2028-02-29"), null);
assert.equal(offsetDay("2026-03-28", 2), "2026-03-30");
console.log(
  `PASS ${count} independent pricing/invalid-input cases; leap dates and DST-safe arithmetic`,
);
