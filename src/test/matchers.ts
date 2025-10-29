import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
  toLogError(...patterns: (string | RegExp)[]): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

/**
 * Custom matcher that expects code to log errors matching the given patterns.
 * Matching errors are suppressed from stderr, non-matching errors are shown.
 *
 * @example
 * ```ts
 * expect(() => {
 *   console.error("Database error");
 * }).toLogError(/Database/);
 *
 * expect(() => {
 *   console.error("Error 1");
 *   console.error("Error 2");
 * }).toLogError(/Error 1/, /Error 2/);
 * ```
 */
expect.extend({
  toLogError(received: () => void | Promise<void>, ...patterns: (string | RegExp)[]) {
    if (typeof received !== "function") {
      return {
        pass: false,
        message: () => "toLogError expects a function, but received: " + typeof received,
      };
    }

    if (patterns.length === 0) {
      return {
        pass: false,
        message: () => "toLogError requires at least one pattern (string or RegExp)",
      };
    }

    // Convert string patterns to RegExp
    const regexPatterns = patterns.map((pattern) =>
      typeof pattern === "string" ? new RegExp(pattern) : pattern
    );

    const originalError = console.error;
    const capturedCalls: unknown[][] = [];
    const matchedPatterns = new Set<number>();

    // Mock console.error to capture all calls
    console.error = (...args: unknown[]) => {
      const message = args.map((arg) => String(arg)).join(" ");

      // Check if this call matches any pattern
      let isMatched = false;
      for (let i = 0; i < regexPatterns.length; i++) {
        if (regexPatterns[i].test(message)) {
          matchedPatterns.add(i);
          isMatched = true;
          break;
        }
      }

      // Store the call and whether it was matched
      capturedCalls.push(args);

      // Only log non-matching errors to stderr
      if (!isMatched) {
        originalError.apply(console, args);
      }
    };

    try {
      // Execute the function
      const result = received();

      // Handle async functions
      if (result instanceof Promise) {
        return result
          .then(() => {
            console.error = originalError;

            // Check if all patterns were matched
            if (matchedPatterns.size === regexPatterns.length) {
              return {
                pass: true,
                message: () =>
                  `Expected function not to log errors matching: ${patterns.map((p) => p.toString()).join(", ")}`,
              };
            }

            // Find unmatched patterns
            const unmatchedPatterns = regexPatterns
              .map((pattern, index) => (matchedPatterns.has(index) ? null : pattern.toString()))
              .filter(Boolean);

            return {
              pass: false,
              message: () => {
                const capturedMessages = capturedCalls.map((call) =>
                  call.map((arg) => String(arg)).join(" ")
                );
                return (
                  `Expected function to log errors matching all patterns.\n` +
                  `Unmatched patterns: ${unmatchedPatterns.join(", ")}\n` +
                  `Captured console.error calls:\n${capturedMessages.map((msg) => `  - ${msg}`).join("\n")}`
                );
              },
            };
          })
          .catch((error) => {
            console.error = originalError;
            throw error;
          });
      }

      // Synchronous execution
      console.error = originalError;

      // Check if all patterns were matched
      if (matchedPatterns.size === regexPatterns.length) {
        return {
          pass: true,
          message: () =>
            `Expected function not to log errors matching: ${patterns.map((p) => p.toString()).join(", ")}`,
        };
      }

      // Find unmatched patterns
      const unmatchedPatterns = regexPatterns
        .map((pattern, index) => (matchedPatterns.has(index) ? null : pattern.toString()))
        .filter(Boolean);

      return {
        pass: false,
        message: () => {
          const capturedMessages = capturedCalls.map((call) =>
            call.map((arg) => String(arg)).join(" ")
          );
          return (
            `Expected function to log errors matching all patterns.\n` +
            `Unmatched patterns: ${unmatchedPatterns.join(", ")}\n` +
            `Captured console.error calls:\n${capturedMessages.map((msg) => `  - ${msg}`).join("\n")}`
          );
        },
      };
    } catch (error) {
      console.error = originalError;
      throw error;
    }
  },
});
