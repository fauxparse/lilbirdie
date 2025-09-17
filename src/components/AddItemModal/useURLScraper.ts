import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import type { ScrapedData } from "@/lib/services/UrlScrapingService";

interface ScrapingError {
  error: string;
  errorType: "validation" | "network" | "timeout" | "blocked" | "parsing" | "unknown";
  suggestion?: string;
  canRetry?: boolean;
}

type ScrapingResult = ScrapedData | ScrapingError;

export const useURLScraper = () => {
  const [urlToScrape, setUrlToScrape] = useState<string | null>(null);

  const query = useQuery<ScrapingResult, Error>({
    queryKey: ["scrape-url", urlToScrape],
    queryFn: async (): Promise<ScrapingResult> => {
      if (!urlToScrape) {
        throw new Error("No URL provided");
      }

      const response = await fetch("/api/scrape-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToScrape }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!urlToScrape, // Only run when we have a URL
    retry: (failureCount, error) => {
      // Don't retry on validation errors or if we've already retried once
      if (failureCount >= 1) return false;

      // Don't retry on network errors that are likely permanent
      if (error.message.includes("400") || error.message.includes("403")) {
        return false;
      }

      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });

  const scrapeURL = (url: string) => {
    setUrlToScrape(url);
  };

  const reset = () => {
    setUrlToScrape(null);
  };

  return {
    scrapeURL,
    isScraping: query.isFetching,
    error: query.error,
    data: query.data,
    reset,
    isError: query.isError,
    isSuccess: query.isSuccess,
  };
};
