"use client";

import { useUserProfile } from "./useUserProfile";

export function useUserPreferredCurrency(): {
  preferredCurrency: string;
  isLoading: boolean;
  error: string | null;
} {
  const { data: profile, isLoading, error } = useUserProfile();

  return {
    preferredCurrency: profile?.preferredCurrency || "NZD",
    isLoading,
    error: error instanceof Error ? error.message : null,
  };
}
