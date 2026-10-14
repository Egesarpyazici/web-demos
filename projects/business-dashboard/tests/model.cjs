const test = require("node:test");
const assert = require("node:assert/strict");
const D = require("../assets/mock-data.js");
const A = require("../assets/analytics.js");
const S = require("../assets/store.js");
const data = D.generate();
const memory = () => {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) || null,
    setItem: (k, v) => map.set(k, v),
    removeItem: (k) => map.delete(k),
  };
};
test("deterministic, unique, consistent fictional records", () => {
  assert.deepEqual(D.generate(), data);
  assert.equal(data.orders.length, 180);
  assert.equal(data.inquiries.length, 96);
  for (const kind of ["orders", "inquiries"])
    assert.equal(new Set(data[kind].map((r) => r.id)).size, data[kind].length);
  for (const o of data.orders) {
    assert.equal(o.amountCents, o.unitCents * o.quantity);
    assert(D.allowedFulfillment(o).includes(o.fulfillment));
    assert(o.date >= "2026-01-01" && o.date <= D.reference);
  }
});
test("independent revenue and open inquiry rules, including zero", () => {
  const records = {
    orders: [
      {
        date: D.reference,
        payment: "paid",
        fulfillment: "completed",
        amountCents: 10000,
      },
      {
        date: D.reference,
        payment: "paid",
        fulfillment: "pending",
        amountCents: 30000,
      },
      {
        date: D.reference,
        payment: "paid",
        fulfillment: "cancelled",
        amountCents: 90000,
      },
      {
        date: D.reference,
        payment: "pending",
        fulfillment: "pending",
        amountCents: 70000,
      },
      {
        date: D.reference,
        payment: "refunded",
        fulfillment: "cancelled",
        amountCents: 50000,
      },
    ],
    inquiries: ["new", "in-progress", "resolved"].map((status) => ({
      date: D.reference,
      status,
    })),
  };
  assert.deepEqual(A.metrics(records, 30), {
    orders: 5,
    revenue: 40000,
    pending: 2,
    open: 2,
    inquiries: 3,
    average: 20000,
    paidOrders: 2,
  });
  assert.equal(A.metrics({ orders: [], inquiries: [] }, 7).average, 0);
});
test("all periods reconcile independent aggregates, chart buckets and distributions", () => {
  for (const days of [7, 30, 90]) {
    const start = new Date(
      Date.parse(D.reference + "T00:00Z") - (days - 1) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    const orders = data.orders.filter((o) => o.date >= start);
    const inquiries = data.inquiries.filter((o) => o.date >= start);
    const m = A.metrics(data, days),
      t = A.trends(data, days);
    assert.equal(
      m.revenue,
      orders
        .filter((o) => o.payment === "paid" && o.fulfillment !== "cancelled")
        .reduce((s, o) => s + o.amountCents, 0),
    );
    assert.equal(
      t.reduce((s, b) => s + b.revenue, 0),
      m.revenue,
    );
    assert.equal(
      t.reduce((s, b) => s + b.orders, 0),
      orders.length,
    );
    assert.equal(
      t.reduce((s, b) => s + b.inquiries, 0),
      inquiries.length,
    );
    assert.equal(
      A.distribution(orders, "fulfillment", D.fulfillment).reduce(
        (s, b) => s + b.count,
        0,
      ),
      orders.length,
    );
    for (let i = 1; i < t.length; i++)
      assert.equal(Date.parse(t[i].from) - Date.parse(t[i - 1].to), 86400000);
  }
  assert.throws(() => A.periodStart(0));
});
test("search and combined filters for both record types", () => {
  const o = data.orders.find((o) => o.payment === "paid");
  assert.deepEqual(
    A.query(data, "orders", { period: 90, search: o.id.toLowerCase() }),
    [o],
  );
  const expected = data.orders
    .filter(
      (r) =>
        r.payment === "paid" &&
        r.fulfillment === "completed" &&
        r.customer.toLowerCase().includes("aster"),
    )
    .map((r) => r.id)
    .sort();
  assert.deepEqual(
    A.query(data, "orders", {
      period: 90,
      search: " ASTER ",
      payment: "paid",
      status: "completed",
    })
      .map((r) => r.id)
      .sort(),
    expected,
  );
  const i = data.inquiries[0];
  assert.deepEqual(
    A.query(data, "inquiries", {
      period: 90,
      search: i.id,
      status: i.status,
      channel: i.channel,
      priority: i.priority,
    }),
    [i],
  );
  assert.equal(
    A.query(data, "orders", { search: "no-such-company" }).length,
    0,
  );
});
test("sorting both directions and pagination with boundary/empty cases", () => {
  for (const kind of ["orders", "inquiries"])
    for (const sort of kind === "orders"
      ? ["date", "amount", "customer"]
      : ["date", "customer", "priority", "status"])
      for (const direction of ["asc", "desc"]) {
        const rows = A.query(data, kind, { period: 90, sort, direction });
        const values = rows.map((r) =>
          sort === "amount"
            ? r.amountCents
            : sort === "priority"
              ? D.priorities.indexOf(r.priority)
              : r[sort],
        );
        for (let i = 1; i < values.length; i++) {
          let delta =
            typeof values[i] === "number"
              ? values[i] - values[i - 1]
              : values[i].localeCompare(values[i - 1], "en");
          assert(direction === "asc" ? delta >= 0 : delta <= 0);
        }
      }
  assert.deepEqual(A.paginate(data.orders, 2).rows, data.orders.slice(10, 20));
  assert.equal(A.paginate(data.orders, 999).page, 18);
  assert.equal(A.paginate([], 3).start, 0);
  assert.equal(A.paginate([], 3).page, 1);
});
test("edits persist, recalculate, support undo and reset only their key", () => {
  const storage = memory();
  storage.setItem("unrelated", "keep");
  const store = S.create(storage),
    o = data.orders.find(
      (o) => o.payment === "paid" && o.fulfillment !== "cancelled",
    );
  const before = A.metrics(store.records(), 90);
  const previous = store.edit("orders", o.id, { fulfillment: "cancelled" });
  assert.equal(
    A.metrics(store.records(), 90).revenue,
    before.revenue - o.amountCents,
  );
  assert.equal(
    S.create(storage)
      .records()
      .orders.find((r) => r.id === o.id).fulfillment,
    "cancelled",
  );
  store.edit("orders", o.id, previous);
  assert.equal(A.metrics(store.records(), 90).revenue, before.revenue);
  const i = data.inquiries.find((i) => i.status !== "resolved");
  store.edit("inquiries", i.id, { status: "resolved", priority: "high" });
  assert.equal(A.metrics(store.records(), 90).open, before.open - 1);
  store.setPeriod(7);
  assert.equal(S.create(storage).period, 7);
  store.reset();
  assert.deepEqual(store.records(), data);
  assert.equal(store.period, 30);
  assert.equal(store.activity.length, 0);
  assert.equal(storage.getItem("unrelated"), "keep");
});
test("reject inconsistent/unknown updates without corrupting state", () => {
  const store = S.create(memory());
  const pending = data.orders.find((o) => o.payment === "pending"),
    refunded = data.orders.find((o) => o.payment === "refunded");
  for (const [id, patch] of [
    [pending.id, { fulfillment: "completed" }],
    [refunded.id, { fulfillment: "pending" }],
    ["unknown", { fulfillment: "completed" }],
    [pending.id, { amountCents: 0 }],
    [pending.id, {}],
  ])
    assert.throws(() => store.edit("orders", id, patch));
  assert.deepEqual(store.records(), data);
});
test("malformed stored data recovers; unavailable storage remains functional", () => {
  for (const raw of [
    "{bad",
    "null",
    "[]",
    JSON.stringify({ ...S.create().snapshot(), version: 9 }),
    JSON.stringify({
      ...S.create().snapshot(),
      orders: { unknown: { fulfillment: "completed" } },
    }),
    JSON.stringify({
      ...S.create().snapshot(),
      inquiries: { [data.inquiries[0].id]: { status: "<script>" } },
    }),
  ]) {
    const storage = memory();
    storage.setItem(S.key, raw);
    const s = S.create(storage);
    assert.equal(s.storageStatus, "recovered");
    assert.deepEqual(s.records(), data);
    assert.equal(storage.getItem(S.key), null);
  }
  const blocked = {
    getItem() {
      throw Error();
    },
    setItem() {
      throw Error();
    },
    removeItem() {
      throw Error();
    },
  };
  const s = S.create(blocked);
  s.edit("inquiries", data.inquiries[0].id, { status: "resolved" });
  assert.equal(s.storageStatus, "unavailable");
  assert.equal(s.records().inquiries[0].status, "resolved");
  s.reset();
  assert.deepEqual(s.records(), data);
});
test("CSV fields escape commas, quotes, newlines, formulas and export all filtered rows", () => {
  assert.equal(A.csvCell('A, "B"'), '"A, ""B"""');
  assert.equal(A.csvCell("line\nbreak"), '"line\nbreak"');
  for (const text of [
    "=1+2",
    " +SUM(A1)",
    "-1",
    "@SUM(A1)",
    "\tformula",
    "\rformula",
  ])
    assert(A.csvCell(text).startsWith("\"'"));
  const rows = A.query(data, "orders", { period: 90, payment: "paid" });
  const csv = A.exportCSV(rows);
  assert.equal(csv.trim().split("\r\n").length, rows.length + 1);
  assert(csv.includes("Fictional demo data"));
  assert(csv.includes((rows[0].amountCents / 100).toFixed(2)));
  assert(csv.includes(rows.at(-1).id));
});
