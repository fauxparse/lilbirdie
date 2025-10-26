"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useIsMounted } from "@/hooks/useIsMounted";
import { useUserProfile } from "@/hooks/useUserProfile";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const mounted = useIsMounted();
  const [pendingTheme, setPendingTheme] = useState<Theme | null>(null);
  const { user, isLoading: isAuthLoading } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const queryClient = useQueryClient();

  // Save theme to database for authenticated users
  const _saveThemeToDatabase = useCallback(
    async (newTheme: Theme) => {
      if (!user) return;

      try {
        await fetch("/api/user/theme", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ theme: newTheme }),
        });
      } catch (error) {
        console.error("Failed to save theme to database:", error);
      }
    },
    [user]
  );

  // Update resolved theme based on system preference
  const updateResolvedTheme = useCallback(
    (currentTheme: Theme) => {
      // Skip if not mounted (server-side)
      if (!mounted || typeof window === "undefined") {
        return;
      }

      if (currentTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        setResolvedTheme(systemTheme);
        document.documentElement.classList.toggle("dark", systemTheme === "dark");
      } else {
        setResolvedTheme(currentTheme);
        document.documentElement.classList.toggle("dark", currentTheme === "dark");
      }
    },
    [mounted]
  );

  // Update theme when profile data changes
  useEffect(() => {
    if (!mounted || isAuthLoading || isProfileLoading) {
      return;
    }

    let initialTheme: Theme;

    if (user && profile?.theme && ["light", "dark", "system"].includes(profile.theme)) {
      // Use user's saved theme from database profile
      initialTheme = profile.theme as Theme;
    } else if (!user) {
      // Fall back to localStorage for non-authenticated users (only on client)
      const storedTheme =
        typeof window !== "undefined" ? (localStorage.getItem("theme") as Theme | null) : null;
      initialTheme = storedTheme || "system";
    } else {
      // User is authenticated but no profile theme yet
      initialTheme = "system";
    }

    setThemeState(initialTheme);
    updateResolvedTheme(initialTheme);
  }, [mounted, user, profile, isAuthLoading, isProfileLoading, updateResolvedTheme]);

  // Apply theme to DOM when mounted state changes
  useEffect(() => {
    if (mounted) {
      updateResolvedTheme(theme);
    }
  }, [mounted, theme, updateResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        updateResolvedTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [mounted, theme, updateResolvedTheme]);

  // Save pending theme when user becomes available
  useEffect(() => {
    if (user && pendingTheme) {
      const saveTheme = async () => {
        try {
          const response = await fetch("/api/user/theme", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ theme: pendingTheme }),
          });

          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
          }
        } catch (error) {
          console.error("Failed to save pending theme:", error);
        } finally {
          setPendingTheme(null);
        }
      };

      saveTheme();
    }
  }, [user, pendingTheme, queryClient]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", newTheme);
      }
      updateResolvedTheme(newTheme);

      if (user) {
        try {
          const response = await fetch("/api/user/theme", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ theme: newTheme }),
          });

          if (response.ok) {
            queryClient.invalidateQueries({ queryKey: ["user-profile", user.id] });
          }
        } catch (error) {
          console.error("Failed to save theme:", error);
        }
      } else {
        setPendingTheme(newTheme);
      }
    },
    [updateResolvedTheme, user, queryClient]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
