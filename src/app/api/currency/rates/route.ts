import { NextResponse } from "next/server";
import { CurrencyService } from "@/lib/services/CurrencyService";
import { CURRENCY_CODES } from "@/types/currency";

export async function GET() {
  try {
    const currencyService = CurrencyService.getInstance();

    const currencies = CURRENCY_CODES;

    const rates = await currencyService.getAllExchangeRates(currencies);

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
