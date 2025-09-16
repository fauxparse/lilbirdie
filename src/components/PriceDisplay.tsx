"use client";
import { cn } from "@/lib/utils";
import { Tooltip } from "./ui/Tooltip";

interface PriceDisplayProps {
  originalPrice: number;
  originalCurrency: string;
  convertedPrice?: number;
  convertedCurrency?: string;
  className?: string;
  showOriginalFirst?: boolean;
}

const getCurrencySymbol = (currency: string, preferredCurrency?: string): string => {
  switch (currency) {
    case "NZD":
      return preferredCurrency === "NZD" ? "$" : "NZ$";
    case "USD":
      return preferredCurrency === "USD" ? "$" : "US$";
    case "AUD":
      return preferredCurrency === "AUD" ? "$" : "A$";
    case "CAD":
      return preferredCurrency === "CAD" ? "$" : "CA$";
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
  className = "font-medium text-base",
}: PriceDisplayProps) {
  // If no conversion available or currencies are the same, just show original
  if (!convertedPrice || !convertedCurrency || originalCurrency === convertedCurrency) {
    return (
      <span className={className}>
        {`${getCurrencySymbol(originalCurrency, convertedCurrency)}${originalPrice.toFixed(2)}`}
      </span>
    );
  }

  return (
    <Tooltip.Root>
      <Tooltip.Trigger className={cn(className, "cursor-help")}>
        <span>
          {`~${getCurrencySymbol(convertedCurrency, convertedCurrency)}${convertedPrice.toFixed(2)}`}
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>
        Converted from{" "}
        <span>{`${getCurrencySymbol(originalCurrency)}${originalPrice.toFixed(2)}`}</span>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}
