"use client";

import { useAuth } from "@/components/AuthProvider";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  const [mounted, setMounted] = useState(false);
  const { user, isLoading } = useAuth();

  // Save theme to database for authenticated users
  const saveThemeToDatabase = useCallback(
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
      if (currentTheme === "system") {
        const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
        setResolvedTheme(systemTheme);
        // Only apply DOM changes if we're mounted (client-side)
        if (mounted) {
          document.documentElement.classList.toggle("dark", systemTheme === "dark");
        }
      } else {
        setResolvedTheme(currentTheme);
        // Only apply DOM changes if we're mounted (client-side)
        if (mounted) {
          document.documentElement.classList.toggle("dark", currentTheme === "dark");
        }
      }
    },
    [mounted]
  );

  // Initialize theme from user profile or localStorage and mark as mounted
  useEffect(() => {
    setMounted(true);

    const initializeTheme = async () => {
      if (!isLoading) {
        let initialTheme: Theme;

        if (user) {
          // Fetch user's profile to get theme preference
          try {
            const response = await fetch("/api/user/profile");
            if (response.ok) {
              const profile = await response.json();
              if (profile?.theme && ["light", "dark", "system"].includes(profile.theme)) {
                initialTheme = profile.theme as Theme;
              } else {
                initialTheme = "system";
              }
            } else {
              initialTheme = "system";
            }
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            initialTheme = "system";
          }
        } else {
          // Fall back to localStorage for non-authenticated users
          const storedTheme = localStorage.getItem("theme") as Theme | null;
          initialTheme = storedTheme || "system";
        }

        setThemeState(initialTheme);
        updateResolvedTheme(initialTheme);
      }
    };

    initializeTheme();
  }, [updateResolvedTheme, user, isLoading]);

  // Apply theme to DOM when mounted state changes
  useEffect(() => {
    if (mounted) {
      updateResolvedTheme(theme);
    }
  }, [mounted, theme, updateResolvedTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleSystemThemeChange = () => {
      if (theme === "system") {
        updateResolvedTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);
    return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
  }, [theme, updateResolvedTheme]);

  const setTheme = useCallback(
    async (newTheme: Theme) => {
      setThemeState(newTheme);
      localStorage.setItem("theme", newTheme);
      updateResolvedTheme(newTheme);

      // Persist to database if user is logged in
      if (user) {
        try {
          await fetch("/api/user/theme", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ theme: newTheme }),
          });
        } catch (error) {
          console.error("Failed to save theme preference:", error);
        }
      }
    },
    [updateResolvedTheme, user]
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
