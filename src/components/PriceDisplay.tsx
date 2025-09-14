"use client";

import { useState } from "react";

interface PriceDisplayProps {
  originalPrice: number;
  originalCurrency: string;
  convertedPrice?: number;
  convertedCurrency?: string;
  className?: string;
  showOriginalFirst?: boolean;
}

const getCurrencySymbol = (currency: string): string => {
  switch (currency) {
    case "NZD":
      return "NZ$";
    case "USD":
      return "$";
    case "AUD":
      return "A$";
    case "CAD":
      return "C$";
    case "EUR":
      return "€";
    case "GBP":
      return "£";
    case "JPY":
      return "¥";
    default:
      return "$";
  }
};

export function PriceDisplay({
  originalPrice,
  originalCurrency,
  convertedPrice,
  convertedCurrency,
  className = "font-semibold text-lg",
  showOriginalFirst = false,
}: PriceDisplayProps) {
  const [showConverted, setShowConverted] = useState(!showOriginalFirst);

  // If no conversion available or currencies are the same, just show original
  if (!convertedPrice || !convertedCurrency || originalCurrency === convertedCurrency) {
    return (
      <span className={className}>
        {getCurrencySymbol(originalCurrency)}
        {originalPrice.toFixed(2)}
      </span>
    );
  }

  const isConverted = showConverted && convertedPrice !== originalPrice;

  return (
    <button
      type="button"
      onClick={() => setShowConverted(!showConverted)}
      className={`${className} cursor-pointer hover:opacity-70 transition-opacity text-left`}
      title={`Click to toggle between ${originalCurrency} and ${convertedCurrency}`}
    >
      {showConverted ? (
        <span>
          ~{getCurrencySymbol(convertedCurrency)}{convertedPrice.toFixed(2)} ({getCurrencySymbol(originalCurrency)}{originalPrice.toFixed(2)})
        </span>
      ) : (
        <span>
          {getCurrencySymbol(originalCurrency)}{originalPrice.toFixed(2)}
        </span>
      )}
    </button>
  );
}
