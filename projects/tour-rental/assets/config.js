/* Single source of commercial DEMO configuration. Amounts are integer EUR cents.
   No real inventory, quote, tax calculation, payment, or booking is represented. */
window.ORIVELA_CONFIG = {
  currency: "EUR",
  locale: "en-IE",
  limits: { minLeadDays: 1, maxAdvanceDays: 365, maxTripDays: 7, minGuests: 1 },
  whatsappNumber: "", // Real authorized international digits only, 7–15 digits, no +.
  packages: {
    coast: {
      name: "Coastal Escape",
      subtitle: "A little further from ordinary.",
      hours: "6 hours per day",
      dailyRate: 120000,
      includedGuests: 6,
      maxGuests: 10,
      extraGuestDaily: 7500,
      optionLabel: "Your coastal route",
      options: {
        islands: { name: "Island passage", dailyRate: 0 },
        coves: { name: "Secluded coves route", dailyRate: 14000 },
      },
    },
    sunset: {
      name: "Golden Hour",
      subtitle: "The coast, in its best light.",
      hours: "3 hours per day",
      dailyRate: 78000,
      includedGuests: 4,
      maxGuests: 8,
      extraGuestDaily: 6000,
      optionLabel: "Your sunset experience",
      options: {
        classic: { name: "Classic sunset", dailyRate: 0 },
        extended: {
          name: "Extended evening · 5 hours per day",
          dailyRate: 18000,
        },
      },
    },
    signature: {
      name: "Signature Days",
      subtitle: "Make the whole day yours.",
      hours: "8 hours per day",
      dailyRate: 190000,
      includedGuests: 8,
      maxGuests: 12,
      extraGuestDaily: 9000,
      optionLabel: "Your vessel concept",
      options: {
        motor: { name: "Signature motor yacht", dailyRate: 0 },
        sail: { name: "Premium sailing yacht", dailyRate: 24000 },
      },
    },
  },
  extras: {
    host: {
      name: "Onboard host",
      price: 18000,
      basis: "day",
      description: "An extra pair of hands for your imagined day.",
    },
    tasting: {
      name: "Coastal tasting menu",
      price: 6500,
      basis: "guest-day",
      description: "A dining concept for everyone in your group, each day.",
    },
    paddle: {
      name: "Paddleboard set",
      price: 9000,
      basis: "booking",
      description: "One equipment set for the full date range.",
    },
    transfer: {
      name: "Return shore transfer",
      price: 3500,
      basis: "guest",
      description: "One return transfer per guest for the entire trip.",
    },
  },
};
