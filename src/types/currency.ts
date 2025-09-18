export const CURRENCY_CODES = ["NZD", "USD", "AUD", "EUR", "GBP", "CAD", "JPY"] as const;

export const CURRENCIES: Record<string, { code: string; name: string; symbol: string }> = {
  NZD: {
    code: "NZD",
    name: "New Zealand Dollar",
    symbol: "NZ$",
  },
  USD: {
    code: "USD",
    name: "United States Dollar",
    symbol: "$",
  },
  AUD: {
    code: "AUD",
    name: "Australian Dollar",
    symbol: "A$",
  },
  EUR: {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  GBP: {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  CAD: {
    code: "CAD",
    name: "Canadian Dollar",
    symbol: "CA$",
  },
  JPY: {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
} as const;

export type Currency = (typeof CURRENCY_CODES)[number];

export const isCurrency = (value: string): value is Currency => {
  return Object.keys(CURRENCIES).includes(value);
};
