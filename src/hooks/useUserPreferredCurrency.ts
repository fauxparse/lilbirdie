"use client";

import { useEffect, useState } from "react";

export function useUserPreferredCurrency(): {
  preferredCurrency: string;
  isLoading: boolean;
  error: string | null;
} {
  const [preferredCurrency, setPreferredCurrency] = useState<string>("NZD");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferredCurrency = async () => {
      try {
        const response = await fetch("/api/profile");

        if (!response.ok) {
          // If not authenticated or error, default to NZD
          setPreferredCurrency("NZD");
          setIsLoading(false);
          return;
        }

        const profile = await response.json();
        setPreferredCurrency(profile.preferredCurrency || "NZD");
        setError(null);
      } catch (err) {
        console.error("Failed to fetch preferred currency:", err);
        setPreferredCurrency("NZD"); // Fallback to NZD
        setError(err instanceof Error ? err.message : "Failed to fetch currency");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferredCurrency();
  }, []);

  return { preferredCurrency, isLoading, error };
}
