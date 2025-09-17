import { NextResponse } from "next/server";
import { CurrencyService } from "@/lib/services/CurrencyService";
import { CURRENCY_CODES } from "@/types/currency";

export async function GET() {
  try {
    const currencyService = CurrencyService.getInstance();

    // Get all supported currencies
    const currencies = CURRENCY_CODES;
    const rates: Record<string, Record<string, number>> = {};

    // Build nested rate structure for efficient lookup
    for (const fromCurrency of currencies) {
      rates[fromCurrency] = {};
      for (const toCurrency of currencies) {
        if (fromCurrency === toCurrency) {
          rates[fromCurrency][toCurrency] = 1;
        } else {
          rates[fromCurrency][toCurrency] = await currencyService.getExchangeRate(
            fromCurrency,
            toCurrency
          );
        }
      }
    }

    return NextResponse.json({
      rates,
      currencies,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to fetch currency rates:", error);
    return NextResponse.json({ error: "Failed to fetch exchange rates" }, { status: 500 });
  }
}
