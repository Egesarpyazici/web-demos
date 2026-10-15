(() => {
  "use strict";
  const translations = window.CLINIC_TRANSLATIONS;
  const localeNames = { en: "en-GB", de: "de-DE", ru: "ru-RU" };
  const serviceKeys = {
    general: "serviceGeneral",
    dental: "serviceDental",
    prevention: "servicePrevention",
    wellbeing: "serviceWellbeing",
  };
  const timeKeys = {
    morning: "timeMorning",
    midday: "timeMidday",
    afternoon: "timeAfternoon",
    late: "timeLate",
  };
  const richKeys = new Set([
    "heroTitle",
    "servicesTitle",
    "principlesTitle",
    "principlesQuote",
    "journeyTitle",
    "spaceTitle",
    "faqTitle",
    "formTitle",
    "contactTitle",
  ]);
  const form = document.querySelector("#inquiry-form");
  const fields = Object.fromEntries(
    ["name", "email", "phone", "service", "date", "time", "message"].map(
      (name) => [name, form.elements.namedItem(name)],
    ),
  );
  const result = document.querySelector("#inquiry-result");
  const summary = document.querySelector("#inquiry-summary");
  const copyStatus = document.querySelector("#copy-status");
  const formStatus = document.querySelector("#form-status");
  const languageControl = document.querySelector("#language");
  const touched = new Set();
  let language = "en";
  let summaryData = null;
  let copyState = "";
  let attempted = false;
  let copyVersion = 0;
  const t = (key) => translations[language][key];

  // The only persisted value is a language code. Form details stay in memory.
  try {
    const saved = localStorage.getItem("avela-language");
    if (Object.hasOwn(localeNames, saved)) language = saved;
  } catch {
    /* Storage may be blocked; the interface still works. */
  }

  const localISO = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const dateFromISO = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(year, month - 1, day, 12);
    return localISO(date) === value ? date : null;
  };
  const formatDate = (value) =>
    new Intl.DateTimeFormat(localeNames[language], {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(dateFromISO(value));
  function updateDateRange() {
    const now = new Date();
    const min = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      12,
    );
    const max = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 90,
      12,
    );
    fields.date.min = localISO(min);
    fields.date.max = localISO(max);
    document.querySelector("#date-hint").textContent = t("dateRange")
      .replace("{min}", formatDate(fields.date.min))
      .replace("{max}", formatDate(fields.date.max));
  }

  const configuredNumber = window.CLINIC_CONFIG?.whatsappNumber;
  const whatsappNumber =
    typeof configuredNumber === "string" &&
    /^[1-9]\d{6,14}$/.test(configuredNumber)
      ? configuredNumber
      : "";
  const whatsappURL = (message) =>
    `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  function updateWhatsApp() {
    const enabled = Boolean(whatsappNumber);
    for (const prefix of ["contact", "summary"]) {
      const link = document.querySelector(`#${prefix}-whatsapp`);
      link.hidden = !enabled;
      document.querySelector(`#${prefix}-wa-off`).hidden = enabled;
      const noteKey = enabled
        ? prefix === "contact"
          ? "contactConfigured"
          : "whatsappReady"
        : "whatsappNote";
      document.querySelector(`#${prefix}-wa-note`).textContent = t(noteKey);
      if (enabled)
        link.href = whatsappURL(
          prefix === "summary" && summaryData
            ? summary.value
            : t("genericMessage"),
        );
      else link.removeAttribute("href");
    }
  }

  function readValues() {
    return Object.fromEntries(
      Object.entries(fields).map(([name, field]) => [name, field.value.trim()]),
    );
  }
  function isValid(name, values) {
    const value = values[name];
    switch (name) {
      case "name":
        return (
          value.length >= 2 &&
          value.length <= 80 &&
          /\p{L}/u.test(value) &&
          !/[\u0000-\u001f\u007f<>]/.test(value)
        );
      case "email":
        return (
          value.length <= 254 &&
          /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) &&
          !fields.email.validity.typeMismatch
        );
      case "phone":
        return (
          /^\+?[\d ()-]+$/.test(value) &&
          value.replace(/\D/g, "").length >= 7 &&
          value.replace(/\D/g, "").length <= 15
        );
      case "service":
        return Object.hasOwn(serviceKeys, value);
      case "time":
        return Object.hasOwn(timeKeys, value);
      case "date":
        return (
          Boolean(dateFromISO(value)) &&
          value >= fields.date.min &&
          value <= fields.date.max
        );
      case "message":
        return value.length <= 600;
      default:
        return false;
    }
  }
  function validateField(name, values = readValues()) {
    const field = fields[name];
    const valid = isValid(name, values);
    const error = document.querySelector(`#${name}-error`);
    field.setAttribute("aria-invalid", String(!valid));
    field.dataset.valid = String(valid && values[name] !== "");
    error.hidden = valid;
    error.textContent = valid ? "" : t(`${name}Error`);
    return valid;
  }
  function invalidateSummary() {
    summaryData = null;
    summary.value = "";
    result.hidden = true;
    copyState = "";
    copyStatus.textContent = "";
    copyVersion += 1;
    document.querySelector("#summary-whatsapp").removeAttribute("href");
  }
  function renderSummary() {
    if (!summaryData) return;
    const data = summaryData;
    const lines = [
      t("summaryHeading"),
      "",
      t("summaryDisclaimer"),
      "",
      ...["name", "email", "phone"].map((key) => `${t(key)}: ${data[key]}`),
      `${t("service")}: ${t(serviceKeys[data.service])}`,
      `${t("date")}: ${formatDate(data.date)}`,
      `${t("time")}: ${t(timeKeys[data.time])}`,
      `${t("message")}: ${data.message || t("noMessage")}`,
    ];
    summary.value = lines.join("\n");
    updateWhatsApp();
  }

  function setLanguage(next, persist = true) {
    if (!Object.hasOwn(localeNames, next)) return;
    language = next;
    document.documentElement.lang = language;
    languageControl.value = language;
    document.title = t("pageTitle");
    document.querySelector('meta[name="description"]').content =
      t("description");
    document.querySelector('meta[property="og:title"]').content =
      document.title;
    document.querySelector('meta[property="og:description"]').content =
      t("description");
    // Only the bundled, developer-authored translation keys may contain markup.
    // User input is always rendered via textContent or textarea.value.
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.dataset.i18n;
      if (richKeys.has(key)) element.innerHTML = t(key);
      else element.textContent = t(key);
    });
    document
      .querySelectorAll("[data-aria]")
      .forEach((element) =>
        element.setAttribute("aria-label", t(element.dataset.aria)),
      );
    document.querySelectorAll("[data-placeholder]").forEach((element) => {
      element.placeholder = t(element.dataset.placeholder);
    });
    updateDateRange();
    for (const name of touched) validateField(name);
    formStatus.textContent =
      attempted &&
      Object.keys(fields).some((name) => !isValid(name, readValues()))
        ? t("formErrors")
        : "";
    copyVersion += 1;
    copyState = "";
    copyStatus.textContent = "";
    renderSummary();
    updateWhatsApp();
    if (persist) {
      try {
        localStorage.setItem("avela-language", language);
      } catch {
        /* Optional preference only. */
      }
    }
  }
  languageControl.addEventListener("change", () =>
    setLanguage(languageControl.value),
  );

  const menu = document.querySelector("#menu-toggle");
  const nav = document.querySelector("#main-nav");
  const narrow = matchMedia("(max-width: 600px)");
  function setMenu(open) {
    menu.setAttribute("aria-expanded", String(open));
    nav.dataset.collapsed = String(narrow.matches && !open);
  }
  function syncMenu() {
    menu.hidden = !narrow.matches;
    setMenu(false);
  }
  menu.addEventListener("click", () =>
    setMenu(menu.getAttribute("aria-expanded") !== "true"),
  );
  narrow.addEventListener("change", syncMenu);
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      narrow.matches &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menu.focus();
    }
  });
  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !narrow.matches) return;
    setMenu(false);
    const target = document.querySelector(link.hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  });
  document.querySelectorAll("[data-service]").forEach((link) =>
    link.addEventListener("click", () => {
      fields.service.value = link.dataset.service;
      invalidateSummary();
      if (touched.has("service")) validateField("service");
    }),
  );
  fields.date.addEventListener("focus", updateDateRange);
  for (const [name, field] of Object.entries(fields)) {
    field.addEventListener("blur", () => {
      touched.add(name);
      validateField(name);
    });
    field.addEventListener("input", () => {
      invalidateSummary();
      if (touched.has(name)) validateField(name);
      if (
        attempted &&
        Object.keys(fields).every((key) => isValid(key, readValues()))
      )
        formStatus.textContent = "";
    });
    field.addEventListener("change", () => {
      invalidateSummary();
      if (touched.has(name)) validateField(name);
    });
  }
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateDateRange();
    attempted = true;
    const values = readValues();
    const invalid = [];
    for (const name of Object.keys(fields)) {
      touched.add(name);
      if (!validateField(name, values)) invalid.push(name);
    }
    if (invalid.length) {
      invalidateSummary();
      formStatus.textContent = t("formErrors");
      fields[invalid[0]].focus();
      return;
    }
    formStatus.textContent = "";
    summaryData = values;
    copyState = "";
    copyStatus.textContent = "";
    copyVersion += 1;
    renderSummary();
    result.hidden = false;
    document.querySelector("#summary-title").focus();
  });
  document
    .querySelector("#copy-summary")
    .addEventListener("click", async () => {
      if (!summaryData) return;
      const version = ++copyVersion;
      const text = summary.value;
      try {
        if (!navigator.clipboard?.writeText)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(text);
        if (version !== copyVersion) return;
        copyState = "copied";
      } catch {
        if (version !== copyVersion) return;
        summary.focus();
        summary.select();
        copyState = "copyFailed";
      }
      copyStatus.textContent = t(copyState);
    });
  setLanguage(language, false);
  syncMenu();
  languageControl.disabled = false;
  document.querySelector("#inquiry-fields").disabled = false;
})();
