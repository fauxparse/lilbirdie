"use client";

import { useEffect, useState } from "react";

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
  const [data, setData] = useState<ConversionData>({
    convertedPrice: null,
    convertedCurrency: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // If same currency, no conversion needed
    if (originalCurrency === targetCurrency) {
      setData({
        convertedPrice: originalPrice,
        convertedCurrency: targetCurrency,
        isLoading: false,
        error: null,
      });
      return;
    }

    // If no price or invalid price, don't attempt conversion
    if (!originalPrice || originalPrice <= 0) {
      setData({
        convertedPrice: null,
        convertedCurrency: null,
        isLoading: false,
        error: null,
      });
      return;
    }

    // Start loading
    setData((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    // Fetch conversion
    const fetchConversion = async () => {
      try {
        const response = await fetch("/api/currency/convert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: originalPrice,
            fromCurrency: originalCurrency,
            toCurrency: targetCurrency,
          }),
        });

        if (!response.ok) {
          throw new Error(`Conversion failed: ${response.status}`);
        }

        const result = await response.json();

        setData({
          convertedPrice: result.convertedAmount,
          convertedCurrency: result.convertedCurrency,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        console.error("Currency conversion error:", error);
        setData({
          convertedPrice: null,
          convertedCurrency: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Conversion failed",
        });
      }
    };

    fetchConversion();
  }, [originalPrice, originalCurrency, targetCurrency]);

  return data;
}
