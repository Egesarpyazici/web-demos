(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.OrdelleData = factory();
})(typeof window === "undefined" ? globalThis : window, function () {
  "use strict";
  const reference = "2026-03-31";
  const fulfillment = ["pending", "processing", "completed", "cancelled"],
    payments = ["paid", "pending", "refunded"],
    inquiryStatuses = ["new", "in-progress", "resolved"],
    priorities = ["low", "normal", "high"],
    channels = ["Email", "Web form", "Phone", "Chat"];
  function generate() {
    let seed = 73129;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const names = [
      "Aster Studio",
      "Moss & Metric",
      "Cedar Works",
      "Juniper Goods",
      "Luma Collective",
      "Fable House",
      "Wren Workshop",
      "Kite Supply",
      "Fieldnote Co.",
      "Harbor Atelier",
      "Pebble Projects",
      "Sora Services",
    ];
    const products = [
      ["Studio essentials kit", 8900],
      ["Workspace setup", 24500],
      ["Brand stationery pack", 12500],
      ["Monthly support plan", 18000],
      ["Digital launch package", 69000],
      ["Product photography", 32000],
    ];
    const date = (days) =>
      new Date(Date.UTC(2026, 0, 1 + days)).toISOString().slice(0, 10);
    const orders = Array.from({ length: 180 }, (_, i) => {
      const product = products[Math.floor(random() * products.length)],
        quantity = 1 + Math.floor(random() * 3),
        payment =
          random() < 0.73 ? "paid" : random() < 0.65 ? "pending" : "refunded";
      const status =
        payment === "refunded"
          ? "cancelled"
          : payment === "pending"
            ? "pending"
            : random() < 0.67
              ? "completed"
              : random() < 0.55
                ? "processing"
                : "pending";
      return {
        id: `ORD-${4101 + i}`,
        customer: `${names[i % names.length]} ${String(Math.floor(i / names.length) + 1).padStart(2, "0")}`,
        date: date(Math.floor(random() * 90)),
        product: product[0],
        quantity,
        unitCents: product[1],
        amountCents: product[1] * quantity,
        payment,
        fulfillment: status,
      };
    });
    const subjects = [
      "Delivery timing question",
      "Plan options for a new workspace",
      "Invoice clarification",
      "Product compatibility",
      "Change to an existing order",
      "Setup guidance",
      "Service availability",
      "Request for product specifications",
    ];
    const inquiries = Array.from({ length: 96 }, (_, i) => ({
      id: `INQ-${2101 + i}`,
      customer: `${names[i % names.length]} ${String(Math.floor(i / names.length) + 1).padStart(2, "0")}`,
      date: date(Math.floor(random() * 90)),
      channel: channels[Math.floor(random() * channels.length)],
      subject: subjects[i % subjects.length],
      priority: priorities[Math.floor(random() * 3)],
      status: inquiryStatuses[Math.floor(random() * 3)],
      representative: ["Avery · Demo", "Morgan · Demo", "Rowan · Demo"][i % 3],
      message: `Fictional sample inquiry about ${subjects[i % subjects.length].toLowerCase()}. This record demonstrates an internal workflow. No real person is waiting for a response.`,
    }));
    return { orders, inquiries };
  }
  function allowedFulfillment(order) {
    return order.payment === "refunded"
      ? ["cancelled"]
      : order.payment === "pending"
        ? ["pending", "processing", "cancelled"]
        : fulfillment;
  }
  return {
    reference,
    fulfillment,
    payments,
    inquiryStatuses,
    priorities,
    channels,
    generate,
    allowedFulfillment,
  };
});
