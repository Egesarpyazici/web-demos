/* Pure hypothetical scenario model. No research-derived or hidden assumptions. */
(function (root, factory) {
  const model = factory();
  if (typeof module === "object" && module.exports) module.exports = model;
  else root.ReplyGap = model;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const fields = Object.freeze({
    inquiries: { min: 0, max: 100000, step: 1, label: "Monthly inquiries" },
    minutes: { min: 0, max: 10080, step: 1, label: "Response time in minutes" },
    value: { min: 0, max: 1000000, step: 0.01, label: "Average sale value" },
    conversion: {
      min: 0,
      max: 100,
      step: 0.1,
      label: "Baseline conversion rate",
    },
    retention: { min: 1, max: 100, step: 1, label: "Conversion retention" },
  });
  const defaults = Object.freeze({
    inquiries: 240,
    minutes: 40,
    value: 250,
    conversion: 25,
    retention: 80,
    currency: "USD",
  });
  const presets = Object.freeze({
    conservative: 90,
    moderate: 80,
    aggressive: 60,
  });
  const currencies = Object.freeze(["USD", "EUR", "GBP"]);
  const reset = () => ({ ...defaults });
  function parse(input) {
    const values = {},
      errors = {};
    for (const [key, rule] of Object.entries(fields)) {
      const raw = input?.[key];
      const text = typeof raw === "string" ? raw.trim() : String(raw);
      const number = Number(text);
      if (
        !["number", "string"].includes(typeof raw) ||
        !/^\d+(?:\.\d+)?$/.test(text) ||
        !Number.isFinite(number) ||
        number < rule.min ||
        number > rule.max ||
        Math.abs(number / rule.step - Math.round(number / rule.step)) > 1e-6
      ) {
        errors[key] =
          `Enter ${rule.min.toLocaleString("en-US")}–${rule.max.toLocaleString("en-US")}${rule.step === 1 ? " as a whole number" : rule.step === 0.1 ? " in steps of 0.1" : " with up to two decimal places"}.`;
      } else values[key] = number;
    }
    if (!currencies.includes(input?.currency))
      errors.currency = "Choose USD, EUR, or GBP.";
    else values.currency = input.currency;
    return { valid: Object.keys(errors).length === 0, values, errors };
  }
  function calculate(input) {
    const checked = parse(input);
    if (!checked.valid) return { ...checked, result: null };
    const v = checked.values,
      p = v.conversion / 100,
      r = v.retention / 100;
    const doublings = Math.max(0, Math.log2(Math.max(v.minutes, 5) / 5));
    const delayedRate = p * Math.pow(r, doublings);
    const potentialCents = Math.round(v.inquiries * p * v.value * 100);
    const currentCents = Math.min(
      potentialCents,
      Math.round(v.inquiries * delayedRate * v.value * 100),
    );
    const missedCents = Math.max(0, potentialCents - currentCents);
    return {
      ...checked,
      result: {
        doublings,
        delayedRate,
        rateDifference: (p - delayedRate) * 100,
        potentialCents,
        currentCents,
        missedCents,
        annualCents: missedCents * 12,
        missedConversions: Math.max(0, v.inquiries * (p - delayedRate)),
      },
    };
  }
  function money(cents, currency = "USD") {
    if (
      !Number.isSafeInteger(cents) ||
      cents < 0 ||
      !currencies.includes(currency)
    )
      throw new RangeError("Invalid currency amount");
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(cents / 100);
  }
  function curve(input) {
    if (!parse(input).valid) return [];
    return [0, 5, 10, 20, 40, 60, 120, 240, 480, 1440, 4320, 10080].map(
      (minutes) => ({ minutes, ...calculate({ ...input, minutes }).result }),
    );
  }
  function summary(input) {
    const state = calculate(input);
    if (!state.valid) return "";
    const v = state.values,
      r = state.result,
      m = (c) => money(c, v.currency),
      n = (x) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
    return [
      "REPLYGAP — THE COST OF WAITING",
      "Hypothetical scenario · Demo / Concept",
      "",
      "INPUTS & ASSUMPTIONS",
      `Monthly inquiries: ${n(v.inquiries)}`,
      `Average response time: ${n(v.minutes)} minutes`,
      `Average sale value: ${m(Math.round(v.value * 100))}`,
      `Currency: ${v.currency} (assumed unit; no exchange-rate conversion)`,
      `Baseline conversion within five minutes: ${n(v.conversion)}%`,
      `Conversion retained per doubling beyond five minutes: ${v.retention}%`,
      "",
      "ILLUSTRATIVE RESULTS",
      `Fast-response potential revenue: ${m(r.potentialCents)} / month`,
      `Current-response estimated revenue: ${m(r.currentCents)} / month`,
      `Missed monthly revenue: ${m(r.missedCents)}`,
      `Annualized amount: ${m(r.annualCents)} (12 identical months)`,
      `Estimated missed conversions: ${n(r.missedConversions)} / month (expected value, not a count of real customers)`,
      `Delayed conversion rate: ${n(r.delayedRate * 100)}%`,
      `Conversion-rate difference: ${n(r.rateDifference)} percentage points`,
      "",
      "MODEL",
      "D = max(0, log2(max(T, 5) / 5)); delayed conversion = P × R^D.",
      "Revenue = inquiries × conversion × average sale value. Revenue rounded to cents; monthly gap is the difference of rounded revenues. Annual amount = monthly gap × 12.",
      "No profit margins, costs, repeat purchases, seasonality, taxes, or real customer behavior are modeled.",
      "",
      "These are adjustable assumptions, not research findings, verified historical losses, causal predictions, or guaranteed recoverable revenue. Inputs are not submitted or persisted automatically. Exporting saves a file only at your request.",
    ].join("\n");
  }
  return Object.freeze({
    fields,
    defaults,
    presets,
    currencies,
    reset,
    parse,
    calculate,
    money,
    curve,
    summary,
  });
});
