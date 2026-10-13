(() => {
  "use strict";
  const config = window.ORIVELA_CONFIG;
  const engine = window.OrivelaPricing;
  const $ = (selector) => document.querySelector(selector);
  const money = (amount) =>
    new Intl.NumberFormat(config.locale, {
      style: "currency",
      currency: config.currency,
    }).format(amount / 100);
  const dateLabel = (value) =>
    new Intl.DateTimeFormat(config.locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`));
  const fields = Object.fromEntries(
    ["package", "start", "end", "guests", "option"].map((key) => [
      key,
      $(`#${key}`),
    ]),
  );
  const contacts = Object.fromEntries(
    ["name", "email", "phone", "message"].map((key) => [key, $(`#${key}`)]),
  );
  const basisLabels = {
    day: "per day",
    "guest-day": "per guest, per day",
    booking: "once per trip",
    guest: "per guest, once per trip",
  };
  let latest,
    summaryReady = false,
    copyVersion = 0;
  const touched = new Set();
  const optionNode = (value, label) => {
    const node = document.createElement("option");
    node.value = value;
    node.textContent = label;
    return node;
  };
  for (const [key, pkg] of Object.entries(config.packages))
    fields.package.append(optionNode(key, pkg.name));
  for (const [key, extra] of Object.entries(config.extras)) {
    const label = document.createElement("label");
    label.className = "extra";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "extras";
    input.value = key;
    input.id = `extra-${key}`;
    const content = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = extra.name;
    const price = document.createElement("span");
    price.className = "extra-price";
    price.textContent = `${money(extra.price)} · ${basisLabels[extra.basis]}`;
    const description = document.createElement("small");
    description.textContent = extra.description;
    content.append(title, price, description);
    label.append(input, content);
    $("#extras").append(label);
  }
  $("#extras").setAttribute("role", "group");
  $("#extras").setAttribute("aria-label", "Optional extras");
  $("#extras").setAttribute("aria-describedby", "extras-error");
  function updateDateLimits() {
    const today = engine.localToday();
    for (const field of [fields.start, fields.end]) {
      field.min = engine.offsetDay(today, config.limits.minLeadDays);
      field.max = engine.offsetDay(today, config.limits.maxAdvanceDays);
    }
    $("#date-rules").textContent =
      `Both dates count: same day = 1 billable day. Up to ${config.limits.maxTripDays} days, from ${dateLabel(fields.start.min)} through ${dateLabel(fields.start.max)}. Each day is one private outing, not an overnight stay.`;
  }
  function updatePackage() {
    const pkg = config.packages[fields.package.value];
    fields.option.replaceChildren(
      ...Object.entries(pkg.options).map(([key, option]) =>
        optionNode(
          key,
          `${option.name} · ${option.dailyRate ? `+${money(option.dailyRate)} / day` : "included"}`,
        ),
      ),
    );
    $("#option-label").textContent = pkg.optionLabel;
    fields.guests.min = config.limits.minGuests;
    fields.guests.max = pkg.maxGuests;
    $("#guest-rule").textContent =
      `${pkg.includedGuests} included; maximum ${pkg.maxGuests}. Each additional guest: ${money(pkg.extraGuestDaily)} per day.`;
  }
  function selection() {
    return {
      ...Object.fromEntries(
        Object.entries(fields).map(([key, node]) => [key, node.value]),
      ),
      extras: [
        ...document.querySelectorAll('input[name="extras"]:checked'),
      ].map((node) => node.value),
    };
  }
  const waNumber =
    typeof config.whatsappNumber === "string" &&
    /^[1-9]\d{6,14}$/.test(config.whatsappNumber)
      ? config.whatsappNumber
      : "";
  const waURL = (text) =>
    `https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`;
  $("#contact-whatsapp").hidden = !waNumber;
  $("#contact-wa-off").hidden = Boolean(waNumber);
  if (waNumber) {
    $("#contact-whatsapp").href = waURL(
      "Hello. I am exploring the Orivela charter website concept and would like to ask a question.",
    );
    $("#contact-wa-note").textContent =
      "Opens WhatsApp, an external service, with a prefilled concept inquiry. You decide whether to send it.";
  }
  function invalidateSummary() {
    summaryReady = false;
    copyVersion++;
    $("#result").hidden = true;
    $("#summary").value = "";
    $("#copy-status").textContent = "";
    $("#summary-whatsapp").removeAttribute("href");
  }
  function updateEstimate() {
    updateDateLimits();
    latest = engine.calculate(selection(), config);
    for (const key of [...Object.keys(fields), "extras"]) {
      const error = $(`#${key}-error`);
      error.hidden = !latest.errors[key];
      error.textContent = latest.errors[key] || "";
      if (fields[key])
        fields[key].setAttribute(
          "aria-invalid",
          String(Boolean(latest.errors[key])),
        );
    }
    $("#breakdown").replaceChildren();
    if (!latest.valid) {
      $("#total").textContent = "—";
      $("#estimate-title").textContent = "A few details to check.";
      $("#estimate-duration").textContent =
        "Correct the highlighted preferences to calculate your estimate.";
      $("#estimate-status").textContent =
        "Estimate unavailable. Check your dates, guests, and package options.";
      $("#selected-trip").textContent =
        "Your estimate needs attention. Check the highlighted preferences above.";
      return;
    }
    const input = selection(),
      pkg = config.packages[input.package];
    $("#estimate-title").textContent = pkg.name;
    $("#estimate-duration").textContent =
      `${dateLabel(input.start)} – ${dateLabel(input.end)} · ${latest.days} billable day${latest.days === 1 ? "" : "s"} · ${latest.guests} guest${latest.guests === 1 ? "" : "s"}`;
    for (const line of latest.lines) {
      const row = document.createElement("div"),
        term = document.createElement("dt"),
        detail = document.createElement("small"),
        amount = document.createElement("dd");
      term.textContent = line.label;
      detail.textContent = line.detail;
      term.append(detail);
      amount.textContent = money(line.amount);
      row.append(term, amount);
      $("#breakdown").append(row);
    }
    $("#total").textContent = money(latest.total);
    $("#estimate-status").textContent =
      `Illustrative total ${money(latest.total)} for ${latest.days} billable days. Not a quote or booking.`;
    const extraNames = input.extras.map((key) => config.extras[key].name);
    $("#selected-trip").textContent =
      `${pkg.name} · ${pkg.options[input.option].name} · ${dateLabel(input.start)} – ${dateLabel(input.end)} · ${latest.guests} guests · Extras: ${extraNames.join(", ") || "none"} · ${money(latest.total)} illustrative total.`;
  }
  $("#model-rules").textContent =
    `Both dates are inclusive. Each selected calendar day repeats one private outing. Trips are limited to ${config.limits.maxTripDays} days, with departures ${config.limits.minLeadDays}–${config.limits.maxAdvanceDays} days from today. Base rate and package-option rate are charged every day, even when the group is smaller than the included allowance.`;
  fields.package.value = Object.keys(config.packages)[0];
  updatePackage();
  updateDateLimits();
  fields.start.value = fields.start.min;
  fields.end.value = fields.start.min;
  fields.guests.value = config.packages[fields.package.value].includedGuests;
  updateEstimate();
  $("#trip-form").addEventListener("input", (event) => {
    if (event.target === fields.package) updatePackage();
    invalidateSummary();
    updateEstimate();
  });
  $("#trip-form").addEventListener("change", (event) => {
    if (event.target === fields.package) updatePackage();
    invalidateSummary();
    updateEstimate();
  });
  $("#trip-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateEstimate();
  });
  for (const date of [fields.start, fields.end])
    date.addEventListener("focus", () => {
      updateDateLimits();
    });
  document.querySelectorAll("[data-package-price]").forEach((node) => {
    const pkg = config.packages[node.dataset.packagePrice];
    node.textContent = `From ${money(pkg.dailyRate)}`;
    const note = document.createElement("small");
    note.textContent = "per private outing · fictional";
    node.append(note);
  });
  document.querySelectorAll("[data-package-spec]").forEach((node) => {
    const pkg = config.packages[node.dataset.packageSpec];
    node.textContent = `${pkg.hours} · ${pkg.includedGuests} guests included · max ${pkg.maxGuests}`;
  });
  document.querySelectorAll("[data-choose]").forEach((link) =>
    link.addEventListener("click", () => {
      fields.package.value = link.dataset.choose;
      updatePackage();
      invalidateSummary();
      updateEstimate();
    }),
  );

  function contactError(key) {
    const value = contacts[key].value.trim();
    if (
      key === "name" &&
      (value.length < 2 ||
        value.length > 80 ||
        !/\p{L}/u.test(value) ||
        /[<>\u0000-\u001f]/.test(value))
    )
      return "Enter your full name (2–80 characters).";
    if (
      key === "email" &&
      (value.length > 254 ||
        !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) ||
        contacts.email.validity.typeMismatch)
    )
      return "Enter a valid email address.";
    if (
      key === "phone" &&
      (!/^\+?[\d ()-]+$/.test(value) ||
        value.replace(/\D/g, "").length < 7 ||
        value.replace(/\D/g, "").length > 15)
    )
      return "Enter 7–15 digits with only an optional leading +, spaces, brackets, or hyphens.";
    if (key === "message" && value.length > 600)
      return "Keep your message to 600 characters or fewer.";
    return "";
  }
  function validateContact(key) {
    const error = contactError(key);
    contacts[key].setAttribute("aria-invalid", String(Boolean(error)));
    contacts[key].dataset.valid = String(
      !error && Boolean(contacts[key].value.trim()),
    );
    $(`#${key}-error`).hidden = !error;
    $(`#${key}-error`).textContent = error;
    return !error;
  }
  for (const [key, field] of Object.entries(contacts)) {
    field.addEventListener("blur", () => {
      touched.add(key);
      validateContact(key);
    });
    field.addEventListener("input", () => {
      invalidateSummary();
      if (touched.has(key)) validateContact(key);
      $("#form-status").textContent = "";
    });
  }
  $("#inquiry-form").addEventListener("submit", (event) => {
    event.preventDefault();
    updateEstimate();
    const invalidContacts = Object.keys(contacts).filter((key) => {
      touched.add(key);
      return !validateContact(key);
    });
    if (!latest.valid || invalidContacts.length) {
      invalidateSummary();
      $("#form-status").textContent =
        "Please check the highlighted fields. Nothing has been sent.";
      const firstInvalid = Object.keys(fields).find(
        (key) => latest.errors[key],
      );
      (firstInvalid
        ? fields[firstInvalid]
        : contacts[invalidContacts[0]]
      )?.focus();
      return;
    }
    $("#form-status").textContent = "";
    copyVersion++;
    $("#copy-status").textContent = "";
    const input = selection(),
      pkg = config.packages[input.package];
    const lines = [
      "ORIVELA — DEMONSTRATION CHARTER INQUIRY",
      "Not submitted, reserved, or booked. Fictional estimate, not a binding quote.",
      "",
      `Name: ${contacts.name.value.trim()}`,
      `Email: ${contacts.email.value.trim()}`,
      `Phone: ${contacts.phone.value.trim()}`,
      "",
      `Experience: ${pkg.name}`,
      `Option: ${pkg.options[input.option].name}`,
      `Dates: ${dateLabel(input.start)} – ${dateLabel(input.end)} (inclusive)`,
      `Billable days: ${latest.days} private outings; no overnight stay`,
      `Guests: ${latest.guests}`,
      `Extras: ${input.extras.map((key) => config.extras[key].name).join(", ") || "None"}`,
      "",
      "ILLUSTRATIVE PRICE BREAKDOWN",
      ...latest.lines.map(
        (line) => `${line.label} — ${line.detail}: ${money(line.amount)}`,
      ),
      `Illustrative total: ${money(latest.total)}`,
      "No additional taxes or fees are calculated in this demo.",
      "",
      `Message: ${contacts.message.value.trim() || "No message provided."}`,
    ];
    $("#summary").value = lines.join("\n");
    summaryReady = true;
    $("#result").hidden = false;
    $("#summary-whatsapp").hidden = !waNumber;
    $("#summary-wa-off").hidden = Boolean(waNumber);
    if (waNumber) {
      $("#summary-whatsapp").href = waURL($("#summary").value);
      $("#summary-wa-note").textContent =
        "Opens WhatsApp with this inquiry. The text is shared with that external service; review it and choose whether to send.";
    }
    $("#result-title").focus();
  });
  $("#copy").addEventListener("click", async () => {
    if (!summaryReady) return;
    const version = ++copyVersion;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText($("#summary").value);
      if (version === copyVersion)
        $("#copy-status").textContent =
          "Summary copied. Nothing has been sent.";
    } catch {
      if (version !== copyVersion) return;
      $("#summary").focus();
      $("#summary").select();
      $("#copy-status").textContent =
        "Automatic copying is unavailable. The summary is selected; use your device’s Copy command.";
    }
  });
  $("#trip-fields").disabled = false;
  $("#contact-fields").disabled = false;

  const menu = $("#menu"),
    nav = $("#navigation"),
    mobile = matchMedia("(max-width: 600px)");
  function setMenu(open) {
    menu.setAttribute("aria-expanded", String(open));
    nav.dataset.collapsed = String(mobile.matches && !open);
  }
  function syncMenu() {
    menu.hidden = !mobile.matches;
    setMenu(false);
  }
  menu.addEventListener("click", () =>
    setMenu(menu.getAttribute("aria-expanded") !== "true"),
  );
  mobile.addEventListener("change", syncMenu);
  syncMenu();
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      mobile.matches &&
      menu.getAttribute("aria-expanded") === "true"
    ) {
      setMenu(false);
      menu.focus();
    }
  });
  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !mobile.matches) return;
    setMenu(false);
    const target = $(link.hash);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
    target.addEventListener("blur", () => target.removeAttribute("tabindex"), {
      once: true,
    });
  });
  const slides = [...document.querySelectorAll(".slide")],
    dots = [...document.querySelectorAll("[data-slide]")];
  const captions = ["The private coast", "The golden hour", "The open horizon"];
  let current = 0,
    pointer = null;
  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.hidden = i !== current;
    });
    dots.forEach((dot, i) =>
      dot.setAttribute("aria-pressed", String(i === current)),
    );
    $("#gallery-status").textContent =
      `Illustration ${current + 1} of ${slides.length} · ${captions[current]}`;
  }
  $("#gallery-view").classList.add("enhanced");
  $("#gallery-controls").hidden = false;
  showSlide(0);
  $("#previous").addEventListener("click", () => showSlide(current - 1));
  $("#next").addEventListener("click", () => showSlide(current + 1));
  dots.forEach((dot) =>
    dot.addEventListener("click", () => showSlide(Number(dot.dataset.slide))),
  );
  $("#gallery-view").addEventListener("keydown", (event) => {
    const actions = {
      ArrowLeft: current - 1,
      ArrowRight: current + 1,
      Home: 0,
      End: slides.length - 1,
    };
    if (Object.hasOwn(actions, event.key)) {
      event.preventDefault();
      showSlide(actions[event.key]);
    }
  });
  $("#gallery-view").addEventListener("pointerdown", (event) => {
    if (event.isPrimary && event.button === 0)
      pointer = { x: event.clientX, y: event.clientY, id: event.pointerId };
  });
  $("#gallery-view").addEventListener("pointerup", (event) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x,
      dy = event.clientY - pointer.y;
    pointer = null;
    if (Math.abs(dx) >= 45 && Math.abs(dx) > Math.abs(dy) * 1.4)
      showSlide(current + (dx < 0 ? 1 : -1));
  });
  $("#gallery-view").addEventListener("pointercancel", () => {
    pointer = null;
  });
  $("#gallery-view").addEventListener("dragstart", (event) =>
    event.preventDefault(),
  );
})();
