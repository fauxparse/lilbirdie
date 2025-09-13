"use client";

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

  // Initialize theme from localStorage and mark as mounted
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem("theme") as Theme | null;
    const initialTheme = storedTheme || "system";
    setThemeState(initialTheme);
    updateResolvedTheme(initialTheme);
  }, [updateResolvedTheme]);

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

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    updateResolvedTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
