"use client";

import { useQuery } from "@tanstack/react-query";

export interface CurrencyRatesResponse {
  rates: Record<string, Record<string, number>>;
  currencies: string[];
  lastUpdated: string;
}

export interface ConversionResult {
  originalAmount: number;
  originalCurrency: string;
  convertedAmount: number;
  convertedCurrency: string;
  rate: number;
  isConverted: boolean;
}

export function useCurrencyRates() {
  const query = useQuery<CurrencyRatesResponse>({
    queryKey: ["currency-rates"],
    queryFn: async (): Promise<CurrencyRatesResponse> => {
      const response = await fetch("/api/currency/rates");
      if (!response.ok) {
        throw new Error("Failed to fetch currency rates");
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // Consider rates fresh for 1 hour
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
  });

  const convertPrice = (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): ConversionResult | null => {
    if (!query.data) return null;

    // Same currency, no conversion needed
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        originalCurrency: fromCurrency,
        convertedAmount: amount,
        convertedCurrency: toCurrency,
        rate: 1,
        isConverted: false,
      };
    }

    // Get rate from cached data
    const rate = query.data.rates[fromCurrency]?.[toCurrency];
    if (!rate) return null;

    const convertedAmount = amount * rate;

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
      convertedCurrency: toCurrency,
      rate,
      isConverted: true,
    };
  };

  return {
    rates: query.data?.rates,
    currencies: query.data?.currencies || [],
    lastUpdated: query.data?.lastUpdated,
    isLoading: query.isLoading,
    error: query.error,
    convertPrice,
  };
}
