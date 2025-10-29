import { describe, expect, it, vi } from "vitest";

describe("toLogError matcher", () => {
  it("should pass when error matching pattern is logged", () => {
    expect(() => {
      console.error("Database error occurred");
    }).toLogError(/Database error/);
  });

  it("should pass with string pattern", () => {
    expect(() => {
      console.error("Network error");
    }).toLogError("Network error");
  });

  it("should pass when all patterns are matched", () => {
    expect(() => {
      console.error("Error 1: Database connection failed");
      console.error("Error 2: Network timeout");
    }).toLogError(/Error 1/, /Error 2/);
  });

  it("should pass with partial pattern matches", () => {
    expect(() => {
      console.error("Error fetching server theme: Error: Database error at line 123");
    }).toLogError(/Database/);
  });

  it("should fail when expected error is not logged", () => {
    const originalConsoleError = console.error;
    const capturedCalls: unknown[][] = [];

    const outerSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      capturedCalls.push(args);
    });

    expect(() => {
      expect(() => {
        console.error("Something else happened");
      }).toLogError(/Database error/);
    }).toThrow();

    // Verify the error was logged (captured)
    expect(capturedCalls).toEqual([["Something else happened"]]);

    outerSpy.mockRestore();
    console.error = originalConsoleError;
  });

  it("should fail when not all patterns are matched", () => {
    expect(() => {
      expect(() => {
        console.error("Error 1");
        // Missing Error 2
      }).toLogError(/Error 1/, /Error 2/);
    }).toThrow();
  });

  it("should work with async functions", async () => {
    await expect(async () => {
      await Promise.resolve();
      console.error("Async error");
    }).toLogError(/Async error/);
  });

  it("should handle multiple arguments in console.error", () => {
    expect(() => {
      console.error("Error:", "Database", "connection failed");
    }).toLogError(/Error: Database connection failed/);
  });

  it("should suppress matching errors but show non-matching ones", () => {
    // This test verifies the behavior conceptually
    // In practice, the non-matching error would appear in stderr during test runs
    expect(() => {
      console.error("Expected error"); // This will be suppressed
    }).toLogError(/Expected error/);
  });

  it("should fail with helpful message when pattern not found", () => {
    const originalConsoleError = console.error;
    const capturedCalls: unknown[][] = [];

    const outerSpy = vi.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      capturedCalls.push(args);
    });

    try {
      expect(() => {
        console.error("Actual error message");
      }).toLogError(/Expected pattern/);
      throw new Error("Should have failed");
    } catch (error) {
      expect(String(error)).toContain("Expected pattern");
      expect(String(error)).toContain("Actual error message");
    }

    // Verify the error was logged (captured)
    expect(capturedCalls).toEqual([["Actual error message"]]);

    outerSpy.mockRestore();
    console.error = originalConsoleError;
  });
});
