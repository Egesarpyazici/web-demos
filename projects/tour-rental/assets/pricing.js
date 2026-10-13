/* Pure calendar/currency calculations, shared by the browser and Node tests. */
(function (root, factory) {
  const engine = factory();
  if (typeof module === "object" && module.exports) module.exports = engine;
  else root.OrivelaPricing = engine;
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const DAY = 86400000;
  function dayNumber(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      return null;
    const date = new Date(`${value}T12:00:00Z`);
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    )
      return null;
    return Math.floor(date.getTime() / DAY);
  }
  function localToday() {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }
  function offsetDay(iso, days) {
    return new Date((dayNumber(iso) + days) * DAY).toISOString().slice(0, 10);
  }
  function calculate(input, config, today = localToday()) {
    const errors = {};
    const pkg = Object.hasOwn(config.packages, input.package)
      ? config.packages[input.package]
      : null;
    const limits = config.limits;
    if (!pkg) errors.package = "Choose one of the listed experiences.";
    const start = dayNumber(input.start),
      end = dayNumber(input.end),
      now = dayNumber(today);
    const min = now + limits.minLeadDays,
      max = now + limits.maxAdvanceDays;
    if (start === null || start < min || start > max)
      errors.start = `Choose a valid start date ${limits.minLeadDays}–${limits.maxAdvanceDays} days from today.`;
    if (end === null || end < min || end > max)
      errors.end = `Choose a valid end date within the next ${limits.maxAdvanceDays} days.`;
    const days = start !== null && end !== null ? end - start + 1 : 0;
    if (start !== null && end !== null && end < start)
      errors.end = "End date must be on or after the start date.";
    else if (days > limits.maxTripDays)
      errors.end = `Choose up to ${limits.maxTripDays} inclusive calendar days.`;
    const rawGuests = String(input.guests ?? "");
    const guests = Number(rawGuests);
    if (
      !/^\d+$/.test(rawGuests) ||
      !Number.isSafeInteger(guests) ||
      guests < limits.minGuests ||
      (pkg && guests > pkg.maxGuests)
    )
      errors.guests = `Choose a whole number of guests from ${limits.minGuests} to ${pkg ? pkg.maxGuests : "the package limit"}.`;
    const option =
      pkg && Object.hasOwn(pkg.options, input.option)
        ? pkg.options[input.option]
        : null;
    if (!option) errors.option = "Choose one of the listed package options.";
    const extras = Array.isArray(input.extras) ? input.extras : [];
    if (
      !Array.isArray(input.extras) ||
      extras.some((key) => !Object.hasOwn(config.extras, key)) ||
      new Set(extras).size !== extras.length
    )
      errors.extras = "Choose each listed extra at most once.";
    if (Object.keys(errors).length)
      return { valid: false, errors, days: null, total: null, lines: [] };
    const lines = [];
    const add = (label, detail, amount) =>
      lines.push({ label, detail, amount });
    add(
      pkg.name,
      `${days} day${days === 1 ? "" : "s"} × base rate`,
      pkg.dailyRate * days,
    );
    const additionalGuests = Math.max(0, guests - pkg.includedGuests);
    add(
      "Additional guests",
      `${additionalGuests} beyond the ${pkg.includedGuests} included × ${days} day${days === 1 ? "" : "s"}`,
      additionalGuests * pkg.extraGuestDaily * days,
    );
    add(
      option.name,
      `${days} day${days === 1 ? "" : "s"} × option rate`,
      option.dailyRate * days,
    );
    for (const key of extras) {
      const extra = config.extras[key];
      const units = {
        day: days,
        "guest-day": guests * days,
        booking: 1,
        guest: guests,
      }[extra.basis];
      const detail = {
        day: `${days} days`,
        "guest-day": `${guests} guests × ${days} days`,
        booking: "Once for the full date range",
        guest: `${guests} guests · once per trip`,
      }[extra.basis];
      add(extra.name, detail, extra.price * units);
    }
    return {
      valid: true,
      errors: {},
      days,
      guests,
      additionalGuests,
      lines,
      total: lines.reduce((sum, line) => sum + line.amount, 0),
    };
  }
  return { calculate, localToday, offsetDay, dayNumber };
});
