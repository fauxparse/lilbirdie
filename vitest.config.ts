/// <reference types="vitest" />
import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.tsx"],
    globals: true,
    css: true,
    // Suppress expected console output
    silent: false,
    // Hide MSW and expected error logs
    onConsoleLog(log, _type) {
      // Hide MSW intercepted request errors (these are expected in tests)
      if (log.includes("[MSW] Error: intercepted a request without a matching request handler")) {
        return false;
      }
      // Hide expected error logs from API route tests
      if (log.includes("Error moving items:") || log.includes("Error claiming item:")) {
        return false;
      }
      // Hide expected permission and database error logs from RBAC tests
      if (log.includes("Permission check failed:") || log.includes("Error fetching permissions:")) {
        return false;
      }
      return true;
    },
    // Include source maps for better error messages
    includeSource: ["src/**/*"],
    // Coverage configuration
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test/",
        "**/*.d.ts",
        "**/*.config.ts",
        "src/app/globals.css",
        ".next",
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    // Mock handling
    server: {
      deps: {
        inline: ["@testing-library/user-event"],
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.vitest": undefined,
    global: "globalThis",
  },
  esbuild: {
    jsxInject: `import React from 'react'`,
  },
});
