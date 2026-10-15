(() => {
  "use strict";
  const D = window.OrdelleData,
    A = window.OrdelleAnalytics,
    $ = (s) => document.querySelector(s),
    $$ = (s) => [...document.querySelectorAll(s)];
  let storage;
  try {
    storage = localStorage;
  } catch {}
  const store = window.OrdelleStore.create(storage),
    pages = { orders: 1, inquiries: 1 };
  const titles = {
    overview: [
      "YOUR BUSINESS, AT A GLANCE",
      "A little clarity. A better day.",
      "Orders, conversations, and the details that keep things moving.",
    ],
    orders: [
      "ORDER OPERATIONS",
      "Every order, in its place.",
      "Fictional records. Real interactions. All in one considered workspace.",
    ],
    inquiries: [
      "CUSTOMER CONVERSATIONS",
      "Make room for the next reply.",
      "Priorities, ownership, and a clear next step for every sample inquiry.",
    ],
    analytics: [
      "THE BIGGER PICTURE",
      "From activity to understanding.",
      "A consistent view of the selected sample period, derived from the records.",
    ],
    settings: [
      "A WORKSPACE TO EXPLORE",
      "Designed for a fresh start.",
      "Understand the demo, review its rules, and manage browser-only data.",
    ],
  };
  const nice = (s) =>
    String(s)
      .replaceAll("-", " ")
      .replace(/^./, (c) => c.toUpperCase());
  const date = (s) =>
    new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(s + "T12:00:00Z"));
  function node(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function icon(name) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("icon");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS(svg.namespaceURI, "use");
    use.setAttribute("href", "#i-" + name);
    svg.append(use);
    return svg;
  }
  function badge(value) {
    return node(
      "span",
      "badge " + value.replaceAll(" ", "-").toLowerCase(),
      nice(value),
    );
  }
  function link(label, view) {
    const a = node("a", "panel-link", label);
    a.href = "#" + view;
    a.append(icon("arrow"));
    return a;
  }
  function panel(title, description) {
    const p = node("article", "panel"),
      head = node("div", "panel-head"),
      copy = node("div");
    copy.append(node("h2", "", title));
    if (description) copy.append(node("p", "", description));
    head.append(copy);
    p.append(head);
    return p;
  }
  function table(headers, rows, caption) {
    const wrap = node("div", "table-scroll");
    wrap.tabIndex = 0;
    wrap.setAttribute("role", "region");
    wrap.setAttribute("aria-label", caption);
    const t = node("table"),
      cap = node("caption", "sr-only", caption),
      thead = node("thead"),
      tr = node("tr");
    headers.forEach((h) => {
      const th = node("th", "", h);
      th.scope = "col";
      tr.append(th);
    });
    thead.append(tr);
    const tbody = node("tbody");
    rows.forEach((cells) => {
      const row = node("tr");
      cells.forEach((content) => {
        const cell = node("td");
        cell.append(
          content instanceof Node ? content : node("span", "", String(content)),
        );
        row.append(cell);
      });
      tbody.append(row);
    });
    t.append(cap, thead, tbody);
    wrap.append(t);
    return wrap;
  }
  let drawCallbacks = [],
    view = "overview",
    activeRecord = null,
    recordTrigger = null,
    undoAction = null;
  const colors = {
    pending: "#b98224",
    processing: "#4266e9",
    completed: "#238a76",
    cancelled: "#8a96a6",
    new: "#4266e9",
    "in-progress": "#b98224",
    resolved: "#238a76",
    Email: "#4266e9",
    "Web form": "#238a76",
    Phone: "#9a70bf",
    Chat: "#b98224",
  };
  function svgEl(tag, attrs, parent) {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.append(e);
    return e;
  }
  function seriesChart(rows, type, title) {
    const p = panel(
        title,
        type === "revenue"
          ? "Paid, non-cancelled orders · USD"
          : "Order and inquiry counts · Same date buckets",
      ),
      chart = node("div", "series-chart");
    const legend = node("div", "chart-legend");
    (type === "revenue"
      ? [["Revenue", "#4266e9"]]
      : [
          ["Orders", "#4266e9"],
          ["Inquiries", "#238a76"],
        ]
    ).forEach(([label, color]) => {
      const span = node("span", "", label),
        dot = node("i");
      dot.style.background = color;
      span.prepend(dot);
      legend.append(span);
    });
    p.append(legend, chart);
    const svg = svgEl(
      "svg",
      {
        role: "img",
        "aria-label":
          title +
          " for the selected fictional sample period. Full values are in the data table below.",
      },
      chart,
    );
    const details = node("details", "chart-data"),
      summary = node("summary", "", "View chart data");
    const dataRows = rows.map((r) => [
      `${date(r.from)} – ${date(r.to)}`,
      type === "revenue" ? A.money(r.revenue) : r.orders,
      ...(type === "revenue" ? [] : [r.inquiries]),
    ]);
    details.append(
      summary,
      table(
        type === "revenue"
          ? ["Sample dates", "Eligible revenue (USD)"]
          : ["Sample dates", "Orders", "Inquiries"],
        dataRows,
        title + " data",
      ),
    );
    p.append(details);
    function draw() {
      const width = Math.max(240, chart.clientWidth),
        height = 220,
        left = type === "revenue" ? 57 : 31,
        right = 14,
        top = 15,
        bottom = 178,
        w = width - left - right;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.replaceChildren();
      const peak = Math.max(
          1,
          ...rows.map((r) =>
            type === "revenue" ? r.revenue : Math.max(r.orders, r.inquiries),
          ),
        ),
        max = type === "revenue" ? peak : Math.ceil(peak / 2) * 2,
        x = (i) => left + (i * w) / Math.max(1, rows.length - 1),
        y = (v) => bottom - (v / max) * (bottom - top);
      for (let i = 0; i < 3; i++) {
        const value = (max * i) / 2,
          yy = y(value);
        svgEl(
          "line",
          { x1: left, x2: width - right, y1: yy, y2: yy, stroke: "#e8edf3" },
          svg,
        );
        const text = svgEl(
          "text",
          { x: left - 9, y: yy + 4, "text-anchor": "end" },
          svg,
        );
        text.textContent =
          type === "revenue"
            ? "$" +
              new Intl.NumberFormat("en-US", {
                notation: "compact",
                maximumFractionDigits: 1,
              }).format(value / 100)
            : new Intl.NumberFormat("en-US", {
                maximumFractionDigits: 1,
              }).format(value);
      }
      const series =
        type === "revenue"
          ? [["revenue", "#4266e9"]]
          : [
              ["orders", "#4266e9"],
              ["inquiries", "#238a76"],
            ];
      for (const [key, color] of series) {
        const d = rows
          .map((r, i) => `${i ? "L" : "M"}${x(i)} ${y(r[key])}`)
          .join(" ");
        if (type === "revenue")
          svgEl(
            "path",
            {
              d: d + `L${x(rows.length - 1)} ${bottom}L${left} ${bottom}Z`,
              fill: "#4266e910",
            },
            svg,
          );
        svgEl(
          "path",
          {
            d,
            fill: "none",
            stroke: color,
            "stroke-width": 2.5,
            "stroke-linejoin": "round",
          },
          svg,
        );
        rows.forEach((r, i) =>
          svgEl(
            "circle",
            {
              cx: x(i),
              cy: y(r[key]),
              r: 3.5,
              fill: "white",
              stroke: color,
              "stroke-width": 2,
            },
            svg,
          ),
        );
      }
      rows.forEach((r, i) => {
        if (
          width < 450 &&
          i !== 0 &&
          i !== rows.length - 1 &&
          i !== Math.floor(rows.length / 2)
        )
          return;
        const text = svgEl(
          "text",
          {
            x: x(i),
            y: 207,
            "text-anchor":
              i === 0 ? "start" : i === rows.length - 1 ? "end" : "middle",
          },
          svg,
        );
        text.textContent = new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "short",
          timeZone: "UTC",
        }).format(new Date(r.from + "T12:00:00Z"));
      });
    }
    drawCallbacks.push(draw);
    return p;
  }
  function distributionChart(items, title, unit) {
    const p = panel(title, "Selected sample period"),
      body = node("div", "distribution"),
      total = items.reduce((s, r) => s + r.count, 0),
      chart = node("div", "donut");
    const svg = svgEl(
      "svg",
      {
        viewBox: "0 0 160 160",
        role: "img",
        "aria-label": `${title}: ${items.map((r) => `${nice(r.label)} ${r.count}`).join(", ")}. Total ${total}.`,
      },
      chart,
    );
    svgEl(
      "circle",
      {
        cx: 80,
        cy: 80,
        r: 62,
        fill: "none",
        stroke: "#edf0f5",
        "stroke-width": 17,
      },
      svg,
    );
    let offset = 0;
    for (const item of items) {
      const fraction = total ? (item.count / total) * 100 : 0;
      if (fraction)
        svgEl(
          "circle",
          {
            cx: 80,
            cy: 80,
            r: 62,
            fill: "none",
            stroke: colors[item.label] || "#4266e9",
            "stroke-width": 17,
            pathLength: 100,
            "stroke-dasharray": `${fraction} ${100 - fraction}`,
            "stroke-dashoffset": -offset,
            transform: "rotate(-90 80 80)",
          },
          svg,
        );
      offset += fraction;
    }
    const val = svgEl(
      "text",
      { x: 80, y: 79, "text-anchor": "middle", class: "donut-value" },
      svg,
    );
    val.textContent = total;
    const label = svgEl(
      "text",
      { x: 80, y: 98, "text-anchor": "middle", class: "donut-label" },
      svg,
    );
    label.textContent = unit;
    const list = node("ul", "distribution-list");
    for (const item of items) {
      const li = node("li"),
        dot = node("i");
      dot.style.background = colors[item.label] || "#4266e9";
      li.append(
        dot,
        node("span", "", nice(item.label)),
        node("strong", "", item.count),
      );
      list.append(li);
    }
    body.append(chart, list);
    p.append(body);
    return p;
  }
  function recordButton(kind, id, label = id) {
    const button = node("button", "record-link", label);
    button.type = "button";
    button.dataset.record = id;
    button.dataset.kind = kind;
    button.setAttribute(
      "aria-label",
      `${label} — Open ${kind === "orders" ? "order" : "inquiry"} ${id} details`,
    );
    button.addEventListener("click", () => openRecord(kind, id, button));
    return button;
  }
  function customer(name) {
    const cell = node("div", "customer-cell"),
      avatar = node(
        "span",
        "customer-avatar",
        name
          .split(" ")
          .slice(0, 2)
          .map((s) => s[0])
          .join(""),
      );
    cell.append(avatar, node("span", "", name));
    return cell;
  }
  function overview(records) {
    const root = $("#overview-content"),
      m = A.metrics(records, store.period);
    root.replaceChildren();
    const cards = node("div", "metric-grid");
    for (const [label, value, note, glyph] of [
      [
        "Total revenue",
        A.money(m.revenue),
        `${m.paidOrders} eligible paid orders`,
        "analytics",
      ],
      [
        "Total orders",
        m.orders,
        "All payment and fulfillment states",
        "orders",
      ],
      [
        "Pending orders",
        m.pending,
        "Awaiting the next fulfillment step",
        "orders",
      ],
      [
        "Open inquiries",
        m.open,
        "New and in-progress conversations",
        "inquiries",
      ],
    ]) {
      const card = node("article", "metric-card");
      const top = node("div", "metric-top");
      top.append(node("span", "", label), icon(glyph));
      card.append(
        top,
        node("strong", "metric-value", value),
        node("small", "", note),
      );
      cards.append(card);
    }
    root.append(cards);
    const summary = node("div", "overview-summary");
    summary.append(
      node("span", "", `Average eligible order value: ${A.money(m.average)}`),
      node("span", "", `${m.inquiries} inquiries in the reporting period`),
    );
    root.append(summary);
    const charts = node("div", "overview-charts");
    charts.append(
      seriesChart(
        A.trends(records, store.period),
        "revenue",
        "Revenue, with a little perspective.",
      ),
      distributionChart(
        A.distribution(
          A.scope(records.orders, store.period),
          "fulfillment",
          D.fulfillment,
        ),
        "Orders by fulfillment",
        "orders",
      ),
    );
    root.append(charts);
    const recent = node("div", "recent-grid"),
      orders = panel("Recent orders", "Latest records in your selected period");
    orders.firstChild.append(link("All orders", "orders"));
    const orderRows = A.query(records, "orders", {
      period: store.period,
    }).slice(0, 5);
    orders.append(
      orderRows.length
        ? table(
            ["Order / customer", "Date", "Amount", "Status"],
            orderRows.map((o) => {
              const id = node("div", "record-name");
              id.append(
                recordButton("orders", o.id),
                node("small", "", o.customer),
              );
              return [
                id,
                date(o.date),
                A.money(o.amountCents),
                badge(o.fulfillment),
              ];
            }),
            "Recent fictional orders",
          )
        : empty("No orders in this sample period."),
    );
    const inquiries = panel(
      "Conversations to keep in view",
      "Recent inquiries, including resolved records",
    );
    inquiries.firstChild.append(link("All inquiries", "inquiries"));
    const list = node("div", "recent-inquiries");
    A.query(records, "inquiries", { period: store.period })
      .slice(0, 4)
      .forEach((r) => {
        const row = node("div", "inquiry-preview"),
          head = node("div");
        head.append(
          recordButton("inquiries", r.id, r.subject),
          badge(r.status),
        );
        row.append(
          head,
          node("p", "", r.customer),
          node(
            "small",
            "",
            `${r.channel} · ${date(r.date)} · ${nice(r.priority)} priority`,
          ),
        );
        list.append(row);
      });
    inquiries.append(
      list.childElementCount
        ? list
        : empty("No inquiries in this sample period."),
    );
    recent.append(orders, inquiries);
    root.append(recent);
    const bottom = node("div", "recent-grid");
    bottom.append(
      seriesChart(
        A.trends(records, store.period),
        "counts",
        "Orders & conversations",
      ),
      activityPanel(records),
    );
    root.append(bottom);
  }
  function empty(message) {
    const div = node("div", "empty-state");
    div.append(
      icon("search"),
      node("h3", "", "A quieter view."),
      node("p", "", message),
    );
    return div;
  }
  function activityPanel(records) {
    const p = panel(
        "Workspace activity",
        "Sample creation events and your browser-only edits",
      ),
      list = node("ol", "activity-list");
    const edits = store.activity
      .filter((a) => {
        const r = records[a.kind].find((x) => x.id === a.id);
        return A.scope([r], store.period).length;
      })
      .slice(0, 4);
    const seeded = [
      ...A.scope(records.orders, store.period).map((r) => ({
        id: r.id,
        date: r.date,
        type: "Order",
      })),
      ...A.scope(records.inquiries, store.period).map((r) => ({
        id: r.id,
        date: r.date,
        type: "Inquiry",
      })),
    ]
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))
      .slice(0, Math.max(0, 5 - edits.length));
    edits.forEach((a) => {
      const li = node("li");
      li.append(
        node("span", "activity-dot"),
        node(
          "strong",
          "",
          `${a.id} · ${nice(a.field)} changed to ${nice(a.value)}`,
        ),
        node(
          "small",
          "",
          `Local edit · ${new Date(a.at).toLocaleString("en-GB")} · record in selected period`,
        ),
      );
      list.append(li);
    });
    seeded.forEach((r) => {
      const li = node("li");
      li.append(
        node("span", "activity-dot sample"),
        node("strong", "", `${r.type} ${r.id} added to sample dataset`),
        node("small", "", `${date(r.date)} · Fictional sample event`),
      );
      list.append(li);
    });
    p.append(
      list.childElementCount
        ? list
        : empty("No activity for records in this sample period."),
    );
    return p;
  }
  function filters(kind) {
    const obj = { period: store.period };
    for (const field of [
      "search",
      "status",
      "payment",
      "channel",
      "priority",
      "sort",
      "direction",
    ]) {
      const e = $(`#${kind}-${field}`);
      if (e) obj[field] = e.value;
    }
    return obj;
  }
  function renderManagement(kind) {
    const options = filters(kind),
      all = A.query(store.records(), kind, options),
      result = A.paginate(all, pages[kind]);
    pages[kind] = result.page;
    const target = $("#" + kind + "-table");
    target.replaceChildren();
    const active = [];
    if (options.search.trim())
      active.push(`Search: “${options.search.trim()}”`);
    for (const key of ["status", "payment", "channel", "priority"])
      if (options[key] && options[key] !== "all")
        active.push(`${nice(key)}: ${nice(options[key])}`);
    $("#" + kind + "-active").textContent =
      `${result.total} ${kind} · ${active.length ? active.join(" · ") : "No list filters"} · ${nice(options.sort)}, ${options.direction === "asc" ? "ascending" : "descending"}`;
    if (!result.total)
      target.append(
        empty("No matching records. Try another search or clear the filters."),
      );
    else if (kind === "orders")
      target.append(
        table(
          [
            "Order ID",
            "Customer",
            "Date",
            "Product / service",
            "Amount (USD)",
            "Payment",
            "Fulfillment",
          ],
          result.rows.map((r) => [
            recordButton(kind, r.id),
            customer(r.customer),
            date(r.date),
            r.product,
            A.money(r.amountCents),
            badge(r.payment),
            badge(r.fulfillment),
          ]),
          "Filtered fictional orders",
        ),
      );
    else
      target.append(
        table(
          [
            "Inquiry ID",
            "Customer / subject",
            "Channel",
            "Date",
            "Priority",
            "Status",
            "Assigned to",
          ],
          result.rows.map((r) => {
            const cell = node("div", "record-name");
            cell.append(
              node("strong", "", r.customer),
              node("small", "", r.subject),
            );
            return [
              recordButton(kind, r.id),
              cell,
              r.channel,
              date(r.date),
              badge(r.priority),
              badge(r.status),
              r.representative,
            ];
          }),
          "Filtered fictional customer inquiries",
        ),
      );
    const nav = $("#" + kind + "-pagination");
    nav.replaceChildren(
      node(
        "span",
        "",
        `Showing ${result.start}–${result.end} of ${result.total}`,
      ),
    );
    const controls = node("div"),
      prev = node("button", "button secondary", "Previous"),
      next = node("button", "button secondary", "Next");
    prev.disabled = result.page === 1;
    next.disabled = result.page === result.pages;
    prev.addEventListener("click", () => {
      pages[kind]--;
      renderManagement(kind);
      const buttons = $$("#" + kind + "-pagination button");
      (buttons[0].disabled ? buttons[1] : buttons[0]).focus();
    });
    next.addEventListener("click", () => {
      pages[kind]++;
      renderManagement(kind);
      const buttons = $$("#" + kind + "-pagination button");
      (buttons[1].disabled ? buttons[0] : buttons[1]).focus();
    });
    controls.append(
      prev,
      node("span", "", `Page ${result.page} of ${result.pages}`),
      next,
    );
    nav.append(controls);
    if (kind === "orders") $("#export-orders").disabled = !all.length;
  }
  function analytics(records) {
    const root = $("#analytics-content");
    root.replaceChildren();
    const m = A.metrics(records, store.period),
      intro = node("div", "analytics-summary");
    intro.append(
      node("span", "", `${A.money(m.revenue)} eligible revenue`),
      node("span", "", `${m.orders} orders`),
      node("span", "", `${m.inquiries} inquiries`),
      node("span", "", `Average eligible order: ${A.money(m.average)}`),
    );
    root.append(intro);
    const grid = node("div", "analytics-grid");
    grid.append(
      seriesChart(
        A.trends(records, store.period),
        "revenue",
        "Revenue across the sample period",
      ),
      seriesChart(
        A.trends(records, store.period),
        "counts",
        "Order and inquiry volume",
      ),
      distributionChart(
        A.distribution(
          A.scope(records.orders, store.period),
          "fulfillment",
          D.fulfillment,
        ),
        "Order fulfillment",
        "orders",
      ),
      distributionChart(
        A.distribution(
          A.scope(records.inquiries, store.period),
          "channel",
          D.channels,
        ),
        "Inquiries by channel",
        "inquiries",
      ),
      distributionChart(
        A.distribution(
          A.scope(records.inquiries, store.period),
          "status",
          D.inquiryStatuses,
        ),
        "Inquiry resolution",
        "inquiries",
      ),
    );
    const rules = panel(
      "A shared source of truth",
      "No disconnected or simulated live figures",
    );
    rules.append(
      node(
        "p",
        "rules-copy",
        "Charts use the same dated records as your lists. Revenue excludes unpaid, refunded, and cancelled orders. Editing a paid order to cancelled removes its amount from revenue; resolving an inquiry changes open counts and the resolution chart.",
      ),
      link("Review all calculation rules", "settings"),
    );
    grid.append(rules);
    root.append(grid);
  }
  function syncStorage() {
    const mode = store.storageStatus;
    $("#save-state").textContent =
      mode === "available"
        ? "Edits saved in this browser only"
        : mode === "recovered"
          ? "Original demo restored · Invalid stored state cleared"
          : "Session-only demo · Storage unavailable";
    $("#storage-status").textContent =
      mode === "available"
        ? "Available · Browser-only persistence"
        : mode === "recovered"
          ? "Invalid stored state replaced with original records"
          : "Unavailable · Changes last only for this session";
    $("#storage-warning").hidden = mode === "available";
    $("#storage-warning").textContent =
      mode === "recovered"
        ? "Stored demo data was invalid. The original sample workspace has been restored."
        : "Browser storage is unavailable. You can still explore and edit, but changes may not survive a refresh.";
  }
  function render() {
    const records = store.records();
    drawCallbacks = [];
    const m = A.metrics(records, store.period);
    $$("[data-nav-count=orders]").forEach((e) => (e.textContent = m.orders));
    $$("[data-nav-count=inquiries]").forEach((e) => (e.textContent = m.open));
    $("#scope-note").textContent =
      `${date(A.periodStart(store.period))} – ${date(D.reference)}`;
    $("#period").value = store.period;
    if (view === "overview") overview(records);
    else if (view === "orders" || view === "inquiries") renderManagement(view);
    else if (view === "analytics") analytics(records);
    syncStorage();
    requestAnimationFrame(() => drawCallbacks.forEach((fn) => fn()));
  }
  function navigate(focus = true) {
    let next = location.hash.slice(1);
    if (!Object.hasOwn(titles, next)) {
      next = "overview";
      history.replaceState(null, "", "#overview");
    }
    view = next;
    $$(".view").forEach((e) => (e.hidden = e.id !== "view-" + view));
    $$("[data-view]").forEach((e) => {
      if (e.dataset.view === view) e.setAttribute("aria-current", "page");
      else e.removeAttribute("aria-current");
    });
    $("#breadcrumb").textContent = nice(view);
    const [eyebrow, heading, description] = titles[view];
    $("#page-eyebrow").textContent = eyebrow;
    $("#view-heading").textContent = heading;
    $("#page-description").textContent = description;
    document.title = `${nice(view)} — Ordelle · Demo / Concept`;
    document.querySelector('meta[property="og:title"]').content =
      document.title;
    render();
    if (focus) {
      $("#view-heading").focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function notify(message, undo = null) {
    undoAction = undo;
    $("#feedback").hidden = false;
    $("#feedback-text").textContent = message;
    $("#undo").hidden = !undo;
  }
  function openRecord(kind, id, trigger) {
    const record = store.records()[kind].find((r) => r.id === id);
    if (!record) return;
    activeRecord = { kind, id };
    recordTrigger = trigger;
    $("#record-title").textContent = id;
    $("#record-kind").textContent =
      kind === "orders"
        ? "ORDER DETAILS · FICTIONAL"
        : "INQUIRY DETAILS · FICTIONAL";
    $("#record-subtitle").textContent = record.customer;
    $("#record-error").hidden = true;
    const details = $("#record-details");
    details.replaceChildren();
    const dl = node("dl", "record-facts");
    const facts =
      kind === "orders"
        ? [
            ["Date", date(record.date)],
            ["Product / service", record.product],
            ["Quantity", record.quantity],
            ["Unit price", A.money(record.unitCents)],
            ["Total", A.money(record.amountCents)],
            ["Payment", nice(record.payment)],
          ]
        : [
            ["Date", date(record.date)],
            ["Subject", record.subject],
            ["Channel", record.channel],
            ["Assigned to", record.representative],
          ];
    facts.forEach(([label, value]) => {
      const pair = node("div");
      pair.append(node("dt", "", label), node("dd", "", value));
      dl.append(pair);
    });
    details.append(dl);
    if (record.message)
      details.append(node("p", "sample-message", record.message));
    const edit = $("#record-edit");
    edit.replaceChildren();
    const selectField = (field, label, values) => {
      const group = node("div", "edit-field"),
        l = node("label", "", label);
      l.htmlFor = "edit-" + field;
      const select = node("select");
      select.id = "edit-" + field;
      values.forEach((value) => {
        const option = node("option", "", nice(value));
        option.value = value;
        select.append(option);
      });
      select.value = record[field];
      group.append(l, select);
      edit.append(group);
    };
    if (kind === "orders") {
      selectField(
        "fulfillment",
        "Fulfillment status",
        D.allowedFulfillment(record),
      );
      edit.append(
        node(
          "p",
          "field-hint",
          record.payment === "refunded"
            ? "Refunded sample orders must remain cancelled."
            : record.payment === "pending"
              ? "Unpaid sample orders cannot be marked completed."
              : "Paid orders can be reclassified for demo exploration. Cancelled orders are excluded from revenue.",
        ),
      );
    } else {
      selectField("status", "Inquiry status", D.inquiryStatuses);
      selectField("priority", "Priority", D.priorities);
    }
    $("#record-dialog").showModal();
    $("#close-record").focus();
  }
  function closeRecord() {
    if ($("#record-dialog").open) $("#record-dialog").close();
  }
  $("#record-dialog").addEventListener("close", () => {
    const replacement = activeRecord
      ? $(
          `#view-${view} [data-record="${activeRecord.id}"][data-kind="${activeRecord.kind}"]`,
        )
      : null;
    const target = recordTrigger?.isConnected
      ? recordTrigger
      : replacement || $("#view-heading");
    target.focus({ preventScroll: true });
    activeRecord = null;
  });
  // Keep Tab cycling inside the active modal, including the browser-chrome boundary.
  $$("dialog").forEach((dialog) =>
    dialog.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const controls = [
        ...dialog.querySelectorAll(
          'a[href], button, input, select, textarea, [tabindex="0"]',
        ),
      ].filter(
        (element) => !element.disabled && element.getClientRects().length,
      );
      const first = controls[0],
        last = controls.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }),
  );
  $("#close-record").addEventListener("click", closeRecord);
  $("#cancel-record").addEventListener("click", closeRecord);
  $("#record-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!activeRecord) return;
    const { kind, id } = activeRecord,
      patch =
        kind === "orders"
          ? { fulfillment: $("#edit-fulfillment").value }
          : {
              status: $("#edit-status").value,
              priority: $("#edit-priority").value,
            };
    try {
      const previous = store.edit(kind, id, patch);
      render();
      notify(
        `${id} updated ${store.storageStatus === "available" ? "in this browser" : "for this session"}. No real order or message was processed.`,
        { kind, id, patch: previous },
      );
      closeRecord();
    } catch {
      $("#record-error").textContent =
        "This update is not valid for the record. Review the selected status.";
      $("#record-error").hidden = false;
    }
  });
  $("#undo").addEventListener("click", () => {
    if (!undoAction) return;
    const { kind, id, patch } = undoAction;
    store.edit(kind, id, patch);
    render();
    notify(`${id}: the previous demo values have been restored.`);
  });
  $("#dismiss-feedback").addEventListener("click", () => {
    $("#feedback").hidden = true;
    undoAction = null;
  });
  for (const kind of ["orders", "inquiries"]) {
    $("#" + kind + "-filters").addEventListener("submit", (event) =>
      event.preventDefault(),
    );
    $("#" + kind + "-filters").addEventListener("input", (event) => {
      if (event.target.tagName !== "INPUT") return;
      pages[kind] = 1;
      renderManagement(kind);
    });
    $("#" + kind + "-filters").addEventListener("change", (event) => {
      if (event.target.tagName !== "SELECT") return;
      pages[kind] = 1;
      renderManagement(kind);
    });
  }
  function clearFilters(kind) {
    $("#" + kind + "-filters").reset();
    pages[kind] = 1;
  }
  $$("[data-clear]").forEach((button) =>
    button.addEventListener("click", () => {
      clearFilters(button.dataset.clear);
      renderManagement(button.dataset.clear);
    }),
  );
  $("#period").addEventListener("change", () => {
    store.setPeriod($("#period").value);
    pages.orders = pages.inquiries = 1;
    render();
  });
  $("#export-orders").addEventListener("click", () => {
    const rows = A.query(store.records(), "orders", filters("orders"));
    if (!rows.length) return;
    const url = URL.createObjectURL(
        new Blob(["\ufeff" + A.exportCSV(rows)], {
          type: "text/csv;charset=utf-8",
        }),
      ),
      a = node("a");
    a.href = url;
    a.download = "ordelle-fictional-orders.csv";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notify(
      `Prepared ${rows.length} fictional orders from the full filtered dataset, not just this page. CSV generated locally.`,
    );
  });
  $("#reset-demo").addEventListener("click", () =>
    $("#reset-dialog").showModal(),
  );
  $("#cancel-reset").addEventListener("click", () =>
    $("#reset-dialog").close(),
  );
  $("#reset-dialog").addEventListener("close", () => $("#reset-demo").focus());
  $("#confirm-reset").addEventListener("click", () => {
    store.reset();
    for (const kind of ["orders", "inquiries"]) clearFilters(kind);
    render();
    $("#reset-dialog").close();
    notify(
      "Original demo records, filters, activity, and reporting period restored.",
    );
  });
  const mobile = matchMedia("(max-width: 950px)");
  function syncMenu() {
    $("#menu").hidden = !mobile.matches;
    if (!mobile.matches && $("#nav-dialog").open) $("#nav-dialog").close();
  }
  $("#menu").addEventListener("click", () => {
    $("#nav-dialog").showModal();
    $("#menu").setAttribute("aria-expanded", "true");
  });
  $("#close-nav").addEventListener("click", () => $("#nav-dialog").close());
  $("#nav-dialog").addEventListener("close", () => {
    $("#menu").setAttribute("aria-expanded", "false");
    $("#menu").focus();
  });
  $("#nav-dialog").addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      $("#nav-dialog").close();
      if (event.target.closest("a").hash === location.hash)
        $("#view-heading").focus();
    }
  });
  mobile.addEventListener("change", syncMenu);
  syncMenu();
  window.addEventListener("hashchange", () => {
    if (location.hash === "#main") return;
    if ($("#record-dialog").open) closeRecord();
    navigate();
  });
  window.addEventListener("resize", () => drawCallbacks.forEach((fn) => fn()));
  $("#period").disabled = false;
  $("#reset-demo").disabled = false;
  $("#export-orders").disabled = false;
  navigate(false);
})();
