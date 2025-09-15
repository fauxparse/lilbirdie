import { CurrencyService } from "@/lib/services/CurrencyService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, fromCurrency, toCurrency } = body;

    // Validate input
    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json(
        { error: "Missing required fields: amount, fromCurrency, toCurrency" },
        { status: 400 }
      );
    }

    if (typeof amount !== "number" || amount < 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 400 });
    }

    if (typeof fromCurrency !== "string" || typeof toCurrency !== "string") {
      return NextResponse.json({ error: "Currencies must be strings" }, { status: 400 });
    }

    // Perform conversion
    const result = await CurrencyService.getInstance().convertPrice(
      amount,
      fromCurrency,
      toCurrency
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Currency conversion error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
