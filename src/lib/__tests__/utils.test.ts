import { describe, expect, it } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge class names correctly", () => {
      const result = cn("text-black", "bg-white");
      expect(result).toBe("text-black bg-white");
    });

    it("should handle conditional class names", () => {
      const isActive = true;
      const result = cn("base-class", isActive && "active-class");
      expect(result).toBe("base-class active-class");
    });

    it("should handle Tailwind conflicts with twMerge", () => {
      const result = cn("text-black text-white");
      expect(result).toBe("text-white");
    });

    it("should handle undefined and null values", () => {
      const result = cn("text-black", undefined, null, "bg-white");
      expect(result).toBe("text-black bg-white");
    });

    it("should handle arrays of class names", () => {
      const result = cn(["text-black", "bg-white"], "p-4");
      expect(result).toBe("text-black bg-white p-4");
    });

    it("should handle objects with boolean values", () => {
      const result = cn({
        "text-black": true,
        "bg-white": false,
        "p-4": true,
      });
      expect(result).toBe("text-black p-4");
    });
  });
});
