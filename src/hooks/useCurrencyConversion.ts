"use client";

import { useCurrencyRates } from "./useCurrencyRates";

interface ConversionData {
  convertedPrice: number | null;
  convertedCurrency: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useCurrencyConversion(
  originalPrice: number,
  originalCurrency: string,
  targetCurrency: string
): ConversionData {
  const { convertPrice, isLoading, error } = useCurrencyRates();

  // If same currency, no conversion needed
  if (originalCurrency === targetCurrency) {
    return {
      convertedPrice: originalPrice,
      convertedCurrency: targetCurrency,
      isLoading: false,
      error: null,
    };
  }

  // If no price or invalid price, don't attempt conversion
  if (!originalPrice || originalPrice <= 0) {
    return {
      convertedPrice: null,
      convertedCurrency: null,
      isLoading: false,
      error: null,
    };
  }

  // If still loading rates, show loading
  if (isLoading) {
    return {
      convertedPrice: null,
      convertedCurrency: null,
      isLoading: true,
      error: null,
    };
  }

  // If error loading rates
  if (error) {
    return {
      convertedPrice: null,
      convertedCurrency: null,
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to load exchange rates",
    };
  }

  // Perform client-side conversion
  const result = convertPrice(originalPrice, originalCurrency, targetCurrency);

  if (!result) {
    return {
      convertedPrice: null,
      convertedCurrency: null,
      isLoading: false,
      error: `No exchange rate available for ${originalCurrency} to ${targetCurrency}`,
    };
  }

  return {
    convertedPrice: result.convertedAmount,
    convertedCurrency: result.convertedCurrency,
    isLoading: false,
    error: null,
  };
}
