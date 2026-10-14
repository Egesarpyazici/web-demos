(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./mock-data.js"));
  else root.OrdelleStore = factory(root.OrdelleData);
})(typeof window === "undefined" ? globalThis : window, function (data) {
  "use strict";
  const key = "ordelle.demo.v1";
  const fresh = () => ({
    version: 1,
    period: 30,
    orders: {},
    inquiries: {},
    activity: [],
  });
  const plain = (v) => v && typeof v === "object" && !Array.isArray(v);
  function create(storage) {
    const base = data.generate();
    let state = fresh(),
      storageStatus = "available";
    function validPatch(kind, id, patch) {
      const record = base[kind]?.find((r) => r.id === id);
      if (!record || !plain(patch)) return false;
      const allowed =
        kind === "orders"
          ? { fulfillment: data.allowedFulfillment(record) }
          : { status: data.inquiryStatuses, priority: data.priorities };
      return Object.entries(patch).every(
        ([field, value]) =>
          Object.hasOwn(allowed, field) && allowed[field].includes(value),
      );
    }
    function validate(value) {
      if (
        !plain(value) ||
        value.version !== 1 ||
        ![7, 30, 90].includes(value.period) ||
        !plain(value.orders) ||
        !plain(value.inquiries) ||
        !Array.isArray(value.activity) ||
        value.activity.length > 40
      )
        return false;
      if (
        Object.keys(value).some(
          (k) =>
            !["version", "period", "orders", "inquiries", "activity"].includes(
              k,
            ),
        )
      )
        return false;
      for (const kind of ["orders", "inquiries"])
        if (
          !Object.entries(value[kind]).every(([id, patch]) =>
            validPatch(kind, id, patch),
          )
        )
          return false;
      return value.activity.every(
        (a) =>
          plain(a) &&
          ["orders", "inquiries"].includes(a.kind) &&
          validPatch(a.kind, a.id, { [a.field]: a.value }) &&
          validPatch(a.kind, a.id, { [a.field]: a.previous }) &&
          typeof a.at === "string" &&
          /^\d{4}-\d{2}-\d{2}T/.test(a.at) &&
          Number.isFinite(Date.parse(a.at)) &&
          Object.keys(a).every((k) =>
            ["kind", "id", "field", "value", "previous", "at"].includes(k),
          ),
      );
    }
    try {
      const raw = storage?.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (!validate(parsed)) throw Error("Malformed demo data");
        state = parsed;
      }
      if (!storage) storageStatus = "unavailable";
    } catch {
      state = fresh();
      storageStatus = "recovered";
      try {
        storage?.removeItem(key);
      } catch {
        storageStatus = "unavailable";
      }
    }
    function persist() {
      try {
        if (!storage) throw Error("Storage unavailable");
        storage.setItem(key, JSON.stringify(state));
        storageStatus = "available";
      } catch {
        storageStatus = "unavailable";
      }
    }
    function records() {
      return {
        orders: base.orders.map((r) => ({ ...r, ...state.orders[r.id] })),
        inquiries: base.inquiries.map((r) => ({
          ...r,
          ...state.inquiries[r.id],
        })),
      };
    }
    function edit(kind, id, patch) {
      if (!validPatch(kind, id, patch) || !Object.keys(patch).length)
        throw Error("Invalid record update");
      const row = records()[kind].find((r) => r.id === id),
        previous = {};
      for (const [field, value] of Object.entries(patch)) {
        previous[field] = row[field];
        if (row[field] !== value) {
          state[kind][id] = { ...state[kind][id], [field]: value };
          state.activity.unshift({
            kind,
            id,
            field,
            value,
            previous: row[field],
            at: new Date().toISOString(),
          });
        }
      }
      state.activity = state.activity.slice(0, 40);
      persist();
      return previous;
    }
    function reset() {
      state = fresh();
      try {
        if (!storage) throw Error("Unavailable");
        storage.removeItem(key);
        storageStatus = "available";
      } catch {
        persist();
      }
    }
    return {
      records,
      edit,
      reset,
      get period() {
        return state.period;
      },
      setPeriod(period) {
        if (![7, 30, 90].includes(Number(period)))
          throw Error("Invalid period");
        state.period = Number(period);
        persist();
      },
      get activity() {
        return state.activity.map((a) => ({ ...a }));
      },
      get storageStatus() {
        return storageStatus;
      },
      snapshot: () => JSON.parse(JSON.stringify(state)),
    };
  }
  return { key, create };
});
