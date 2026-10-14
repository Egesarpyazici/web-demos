(() => {
  "use strict";
  const model = window.ReplyGap,
    $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  const keys = Object.keys(model.fields),
    inputs = Object.fromEntries(keys.map((k) => [k, $("#" + k)]));
  let state,
    announcement,
    version = 0;
  const number = (n) =>
    new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
  const time = (n) =>
    n === 0
      ? "0 min"
      : n < 60
        ? `${number(n)} min`
        : n % 1440 === 0
          ? `${n / 1440} day${n === 1440 ? "" : "s"}`
          : n % 60 === 0
            ? `${n / 60} hour${n === 60 ? "" : "s"}`
            : `${number(n)} min`;
  function read() {
    return {
      ...Object.fromEntries(keys.map((k) => [k, inputs[k].value])),
      currency: $("#currency").value,
    };
  }
  for (const key of keys) {
    for (const input of [inputs[key], $("#" + key + "-range")]) {
      Object.assign(input, {
        min: model.fields[key].min,
        max: model.fields[key].max,
        step: model.fields[key].step,
        value: model.defaults[key],
      });
    }
  }
  const NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, parent) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    parent.append(el);
    return el;
  }
  const ticks = [5, 60, 1440, 10080],
    pointTimes = [5, 20, 60, 240, 1440, 10080];
  const grid = $("#curve-grid"),
    pointGroup = $("#curve-points");
  const gridRows = [0, 0.5, 1].map(() => ({
    line: svg("line", {}, grid),
    label: svg("text", {}, grid),
  }));
  const tickLabels = ticks.map(() => svg("text", {}, grid));
  const points = pointTimes.map((minutes) => {
    const g = svg(
      "g",
      { role: "button", tabindex: "0", "data-minutes": minutes },
      pointGroup,
    );
    svg("circle", { r: 12, class: "hit" }, g);
    svg("circle", { r: 4, class: "dot" }, g);
    g.addEventListener("click", () => setMinutes(minutes));
    g.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        setMinutes(minutes);
      }
      if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        const index = points.indexOf(g);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? points.length - 1
              : (index +
                  (event.key === "ArrowRight" ? 1 : -1) +
                  points.length) %
                points.length;
        points[next].focus();
      }
    });
    return g;
  });
  function setMinutes(value) {
    inputs.minutes.value = value;
    sync("minutes");
    update();
  }
  function sync(key) {
    const valid = model.parse(read());
    const range = $("#" + key + "-range");
    if (!valid.errors[key]) {
      range.value = inputs[key].value;
      range.removeAttribute("aria-valuetext");
    } else
      range.setAttribute(
        "aria-valuetext",
        `Last valid slider value ${range.value}. The number field needs attention; move the slider to replace it.`,
      );
  }
  function renderCurve() {
    const valid = state?.valid;
    $("#curve-chart").toggleAttribute("hidden", !valid);
    if (!valid) return;
    const v = state.values,
      r = state.result;
    const width = Math.max(180, $("#curve-wrap").clientWidth),
      height = 240,
      left = 36,
      right = 15,
      top = 22,
      bottom = 201;
    const span = width - left - right,
      maxY = Math.max(v.conversion, 1);
    const x = (t) =>
      left + (Math.log2(Math.max(t, 5) / 5) / Math.log2(10080 / 5)) * span;
    const y = (rate) => bottom - (rate / maxY) * (bottom - top);
    $("#curve-chart").setAttribute("viewBox", `0 0 ${width} ${height}`);
    gridRows.forEach((row, i) => {
      const value = (maxY * i) / 2,
        yy = y(value);
      for (const [key, val] of Object.entries({
        x1: left,
        x2: width - right,
        y1: yy,
        y2: yy,
      }))
        row.line.setAttribute(key, val);
      row.label.setAttribute("x", left - 9);
      row.label.setAttribute("y", yy + 4);
      row.label.setAttribute("text-anchor", "end");
      row.label.textContent = number(value);
    });
    tickLabels.forEach((el, i) => {
      el.setAttribute("x", x(ticks[i]));
      el.setAttribute("y", 230);
      el.setAttribute(
        "text-anchor",
        i === 0 ? "start" : i === ticks.length - 1 ? "end" : "middle",
      );
      el.textContent = ["5 min", "1 hr", "1 day", "7 days"][i];
    });
    const samples = Array.from({ length: 100 }, (_, i) => {
      const minutes = Math.round(5 * Math.pow(10080 / 5, i / 99));
      return [
        x(minutes),
        y(model.calculate({ ...v, minutes }).result.delayedRate * 100),
      ];
    });
    const d = samples
      .map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(2)} ${p[1].toFixed(2)}`)
      .join(" ");
    $("#curve-line").setAttribute("d", d);
    $("#curve-area").setAttribute(
      "d",
      `${d}L${width - right} ${bottom}L${left} ${bottom}Z`,
    );
    points.forEach((el, i) => {
      const minutes = pointTimes[i],
        point = model.calculate({ ...v, minutes }).result;
      el.setAttribute(
        "transform",
        `translate(${x(minutes)},${y(point.delayedRate * 100)})`,
      );
      el.setAttribute(
        "aria-label",
        `${time(minutes)}: ${number(point.delayedRate * 100)}% hypothetical conversion. Set response time.`,
      );
      el.setAttribute("aria-pressed", String(v.minutes === minutes));
    });
    const xx = x(v.minutes),
      yy = y(r.delayedRate * 100);
    for (const [key, val] of Object.entries({
      x1: xx,
      x2: xx,
      y1: yy,
      y2: bottom,
    }))
      $("#selected-line").setAttribute(key, val);
    $("#selected-point").setAttribute("cx", xx);
    $("#selected-point").setAttribute("cy", yy);
    $("#curve-selection").textContent = `Selected: ${time(v.minutes)}`;
    $("#curve-desc").textContent =
      `Hypothetical conversion from ${number(v.conversion)}% within five minutes to ${number(model.calculate({ ...v, minutes: 10080 }).result.delayedRate * 100)}% at seven days. Logarithmic time axis. Use the six points to set response time, or read the data table below.`;
  }
  function renderTable() {
    $("#chart-table").replaceChildren();
    if (!state.valid) {
      const row = document.createElement("tr"),
        cell = document.createElement("td");
      cell.colSpan = 4;
      cell.textContent = "Enter valid inputs to see chart data.";
      row.append(cell);
      $("#chart-table").append(row);
      return;
    }
    const v = state.values;
    const rows = [
      ...model.curve(v),
      { minutes: v.minutes, ...state.result, selected: true },
    ];
    for (const point of rows) {
      const row = document.createElement("tr");
      if (point.selected) row.setAttribute("aria-current", "true");
      const values = [
        `${point.selected ? "Selected · " : ""}${time(point.minutes)}`,
        `${number(point.delayedRate * 100)}%`,
        model.money(point.currentCents, v.currency),
        model.money(point.missedCents, v.currency),
      ];
      values.forEach((value, i) => {
        const cell = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) cell.scope = "row";
        cell.textContent = value;
        row.append(cell);
      });
      $("#chart-table").append(row);
    }
  }
  function update({ announce = true, animate = true } = {}) {
    state = model.calculate(read());
    version++;
    $("#copy-status").textContent = "";
    for (const key of [...keys, "currency"]) {
      const error = $("#" + key + "-error");
      error.textContent = state.errors[key] || "";
      error.hidden = !state.errors[key];
      $("#" + key).setAttribute(
        "aria-invalid",
        String(Boolean(state.errors[key])),
      );
    }
    $("#invalid-notice").hidden = state.valid;
    $(".signal-visual").hidden = !state.valid;
    $("#result-state").textContent = state.valid
      ? "HYPOTHETICAL SCENARIO"
      : "CHECK INPUTS";
    $("#value-unit").textContent = model.currencies.includes(
      $("#currency").value,
    )
      ? $("#currency").value
      : "Currency";
    $$("[data-currency]").forEach(
      (el) => (el.textContent = `${$("#value-unit").textContent} / month`),
    );
    for (const el of $$("[data-preset]"))
      el.setAttribute(
        "aria-pressed",
        String(
          Number(inputs.retention.value) === model.presets[el.dataset.preset],
        ),
      );
    for (const el of $$("[data-time]"))
      el.setAttribute(
        "aria-pressed",
        String(
          inputs.minutes.value !== "" &&
            Number(inputs.minutes.value) === Number(el.dataset.time),
        ),
      );
    const preset = Object.keys(model.presets).find(
      (key) => model.presets[key] === Number(inputs.retention.value),
    );
    $("#preset-note").textContent =
      `${preset ? `${preset[0].toUpperCase() + preset.slice(1)} · ${model.presets[preset]}% retained` : "Custom retention assumption"}. Illustrative, not research findings.`;
    for (const id of ["copy", "download", "print"])
      $("#" + id).disabled = !state.valid;
    let values = {};
    if (state.valid) {
      const r = state.result,
        v = state.values,
        m = (c) => model.money(c, v.currency);
      values = {
        missed: m(r.missedCents),
        annual: m(r.annualCents),
        current: m(r.currentCents),
        potential: m(r.potentialCents),
        conversions: number(r.missedConversions),
        difference: `${number(r.rateDifference)} pp`,
        delayed: `${number(r.delayedRate * 100)}%`,
      };
      $("#hero-time").textContent = time(v.minutes);
      const signalY =
        25 + (v.conversion ? 1 - r.delayedRate / (v.conversion / 100) : 0) * 55;
      $("#signal-line").setAttribute("d", `M20 25L280 ${signalY}`);
      $("#signal-end").setAttribute("cy", signalY);

      $("#potential-bar").setAttribute("width", r.potentialCents ? 500 : 0);
      $("#current-bar").setAttribute(
        "width",
        r.potentialCents ? (500 * r.currentCents) / r.potentialCents : 0,
      );
      $("#revenue-desc").textContent =
        `Fast response: ${m(r.potentialCents)} per month. Current response: ${m(r.currentCents)} per month. Hypothetical difference: ${m(r.missedCents)}. Currency ${v.currency}.`;
    } else {
      $("#signal-line").setAttribute("d", "");
      $("#signal-end").setAttribute("cy", 25);
      $("#hero-time").textContent = "Check your inputs";
      $("#potential-bar").setAttribute("width", 0);
      $("#current-bar").setAttribute("width", 0);
      $("#revenue-desc").textContent =
        "Results unavailable. Correct the highlighted inputs.";
      $("#curve-selection").textContent = "Results unavailable";
    }
    for (const el of $$("[data-result]"))
      el.textContent = values[el.dataset.result] || "—";
    $("#summary").value = model.summary(read());
    $("#summary").placeholder = state.valid
      ? ""
      : "Correct the highlighted inputs to generate a current report.";
    renderCurve();
    renderTable();
    if (animate && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      $$(".primary-result [data-result]").forEach((el) => {
        el.classList.remove("result-refresh");
        void el.offsetWidth;
        el.classList.add("result-refresh");
      });
    }
    clearTimeout(announcement);
    if (announce)
      announcement = setTimeout(() => {
        $("#live-status").textContent = state.valid
          ? `Scenario updated. Illustrative monthly gap ${values.missed}. Current conversion ${values.delayed}. Not a prediction.`
          : "Results unavailable. Correct the highlighted inputs.";
      }, 600);
  }
  for (const key of keys) {
    inputs[key].addEventListener("input", () => {
      sync(key);
      update();
    });
    $("#" + key + "-range").addEventListener("input", (event) => {
      inputs[key].value = event.target.value;
      event.target.removeAttribute("aria-valuetext");
      update();
    });
  }
  $("#currency").addEventListener("change", () => update());
  $$("[data-time]").forEach((el) =>
    el.addEventListener("click", () => setMinutes(Number(el.dataset.time))),
  );
  $$("[data-preset]").forEach((el) =>
    el.addEventListener("click", () => {
      inputs.retention.value = model.presets[el.dataset.preset];
      sync("retention");
      update();
    }),
  );
  $("#scenario-form").addEventListener("submit", (event) => {
    event.preventDefault();
    update();
    keys.find((k) => state.errors[k]) &&
      inputs[keys.find((k) => state.errors[k])].focus();
  });
  $("#reset").addEventListener("click", () => {
    const values = model.reset();
    for (const key of keys) {
      inputs[key].value = values[key];
      $("#" + key + "-range").value = values[key];
      $("#" + key + "-range").removeAttribute("aria-valuetext");
    }
    $("#currency").value = values.currency;
    update();
    $("#copy-status").textContent = "Documented defaults restored.";
  });
  $("#copy").addEventListener("click", async () => {
    if (!state.valid) return;
    const current = version,
      text = $("#summary").value;
    try {
      if (!navigator.clipboard?.writeText) throw Error("Unavailable");
      await navigator.clipboard.writeText(text);
      if (current === version)
        $("#copy-status").textContent =
          "Scenario copied. Nothing has been sent.";
    } catch {
      if (current !== version) return;
      $("#summary").focus();
      $("#summary").select();
      $("#copy-status").textContent =
        "Automatic copying is unavailable. The current summary is selected; use your device’s Copy command.";
    }
  });
  $("#download").addEventListener("click", () => {
    if (!state.valid) return;
    const blob = new Blob([$("#summary").value], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob),
      link = document.createElement("a");
    link.href = url;
    link.download = "replygap-scenario.txt";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $("#copy-status").textContent =
      "Text file prepared locally. Nothing has been sent.";
  });
  const printText = document.createElement("pre");
  printText.className = "print-text";
  printText.hidden = true;
  $(".report-preview").append(printText);
  function preparePrint() {
    printText.textContent = state.valid
      ? $("#summary").value
      : "No valid scenario. Correct the inputs before printing.";
    printText.hidden = false;
  }
  window.addEventListener("beforeprint", preparePrint);
  window.addEventListener("afterprint", () => (printText.hidden = true));
  $("#print").addEventListener("click", () => {
    if (!state.valid) return;
    preparePrint();
    window.print();
  });
  const email = window.PORTFOLIO_CONFIG?.email;
  if (
    typeof email === "string" &&
    email.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(
      email,
    )
  ) {
    $("#contact-link").href =
      `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("Consultation inquiry — ReplyGap concept")}`;
    $("#contact-link").hidden = false;
    $("#contact-unavailable").textContent =
      "Opens your email application. Scenario data is not attached automatically.";
  }
  const mobile = matchMedia("(max-width: 800px)");
  let controlsVisible = false;
  const mobileResult = $(".mobile-result");
  const syncMobile = () =>
    (mobileResult.hidden = !(mobile.matches && controlsVisible));
  if ("IntersectionObserver" in window)
    new IntersectionObserver(
      (entries) => {
        controlsVisible = entries[0].isIntersecting;
        syncMobile();
      },
      { rootMargin: "-110px 0px -80px 0px" },
    ).observe($(".controls-panel"));
  mobile.addEventListener("change", syncMobile);
  $(".mobile-result a").addEventListener("click", () =>
    $("#results").focus({ preventScroll: true }),
  );
  $("#input-fields").disabled = false;
  update({ announce: false, animate: false });
  if ("ResizeObserver" in window)
    new ResizeObserver(() => renderCurve()).observe($("#curve-wrap"));
  else window.addEventListener("resize", renderCurve);
})();
