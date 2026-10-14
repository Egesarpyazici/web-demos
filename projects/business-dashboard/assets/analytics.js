(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./mock-data.js"));
  else root.OrdelleAnalytics = factory(root.OrdelleData);
})(typeof window === "undefined" ? globalThis : window, function (data) {
  "use strict";
  const money = (cents) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  function periodStart(days) {
    if (![7, 30, 90].includes(Number(days))) throw Error("Unsupported period");
    return new Date(
      Date.parse(data.reference + "T00:00:00Z") - (Number(days) - 1) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
  }
  const scope = (rows, days) =>
    rows.filter((r) => r.date >= periodStart(days) && r.date <= data.reference);
  const eligible = (o) => o.payment === "paid" && o.fulfillment !== "cancelled";
  function metrics(records, days) {
    const orders = scope(records.orders, days),
      inquiries = scope(records.inquiries, days),
      paid = orders.filter(eligible);
    const revenue = paid.reduce((sum, o) => sum + o.amountCents, 0);
    return {
      orders: orders.length,
      revenue,
      pending: orders.filter((o) => o.fulfillment === "pending").length,
      open: inquiries.filter((i) => i.status !== "resolved").length,
      inquiries: inquiries.length,
      average: paid.length ? Math.round(revenue / paid.length) : 0,
      paidOrders: paid.length,
    };
  }
  function distribution(rows, key, values) {
    return values.map((label) => ({
      label,
      count: rows.filter((r) => r[key] === label).length,
    }));
  }
  function trends(records, days) {
    const start = periodStart(days),
      end = data.reference,
      bucket = days === 7 ? 1 : days === 30 ? 5 : 15,
      rows = [];
    for (
      let time = Date.parse(start + "T00:00:00Z");
      time <= Date.parse(end + "T00:00:00Z");
      time += bucket * 86400000
    ) {
      const from = new Date(time).toISOString().slice(0, 10),
        to = new Date(
          Math.min(
            time + (bucket - 1) * 86400000,
            Date.parse(end + "T00:00:00Z"),
          ),
        )
          .toISOString()
          .slice(0, 10),
        orders = records.orders.filter((r) => r.date >= from && r.date <= to),
        inquiries = records.inquiries.filter(
          (r) => r.date >= from && r.date <= to,
        );
      rows.push({
        from,
        to,
        revenue: orders
          .filter(eligible)
          .reduce((sum, r) => sum + r.amountCents, 0),
        orders: orders.length,
        inquiries: inquiries.length,
      });
    }
    return rows;
  }
  function query(records, kind, options = {}) {
    const {
      search = "",
      status = "all",
      payment = "all",
      channel = "all",
      priority = "all",
      sort = "date",
      direction = "desc",
      period = 30,
    } = options;
    const needle = String(search).trim().toLowerCase();
    const rows = scope(records[kind], Number(period)).filter((r) => {
      const text =
        kind === "orders"
          ? `${r.id} ${r.customer} ${r.product}`
          : `${r.id} ${r.customer} ${r.subject} ${r.representative}`;
      return (
        (!needle || text.toLowerCase().includes(needle)) &&
        (status === "all" ||
          r[kind === "orders" ? "fulfillment" : "status"] === status) &&
        (kind !== "orders" || payment === "all" || r.payment === payment) &&
        (kind !== "inquiries" || channel === "all" || r.channel === channel) &&
        (kind !== "inquiries" || priority === "all" || r.priority === priority)
      );
    });
    const key =
      {
        date: "date",
        amount: "amountCents",
        customer: "customer",
        priority: "priority",
        status: kind === "orders" ? "fulfillment" : "status",
      }[sort] || "date";
    return rows.sort((a, b) => {
      let x = a[key],
        y = b[key];
      if (key === "priority") {
        x = data.priorities.indexOf(x);
        y = data.priorities.indexOf(y);
      }
      const delta =
        typeof x === "number"
          ? x - y
          : String(x).localeCompare(String(y), "en");
      return (direction === "asc" ? 1 : -1) * delta || a.id.localeCompare(b.id);
    });
  }
  function paginate(rows, page = 1, size = 10) {
    const pages = Math.max(1, Math.ceil(rows.length / size)),
      current = Math.min(pages, Math.max(1, Math.floor(page) || 1));
    return {
      rows: rows.slice((current - 1) * size, current * size),
      page: current,
      pages,
      total: rows.length,
      start: rows.length ? (current - 1) * size + 1 : 0,
      end: Math.min(current * size, rows.length),
    };
  }
  function csvCell(value) {
    let text = String(value ?? "");
    if (/^[\s]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  }
  function exportCSV(rows) {
    const headers = [
      "Data type",
      "Order ID",
      "Fictional customer",
      "Date",
      "Product or service",
      "Quantity",
      "Amount USD",
      "Payment status",
      "Fulfillment status",
    ];
    return (
      [
        headers,
        ...rows.map((r) => [
          "Fictional demo data",
          r.id,
          r.customer,
          r.date,
          r.product,
          r.quantity,
          (r.amountCents / 100).toFixed(2),
          r.payment,
          r.fulfillment,
        ]),
      ]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n") + "\r\n"
    );
  }
  return {
    money,
    periodStart,
    scope,
    eligible,
    metrics,
    distribution,
    trends,
    query,
    paginate,
    csvCell,
    exportCSV,
  };
});
