import { describe, it, expect } from "vitest";
import { formatBytes, truncate, padRight } from "@/lib/format.js";

describe("[Unit] Format", () => {
  describe("formatBytes", () => {
    it("SHOULD return '0 B' for zero bytes", () => {
      expect(formatBytes(0)).toBe("0 B");
    });

    it("SHOULD format bytes without decimals", () => {
      expect(formatBytes(500)).toBe("500 B");
    });

    it("SHOULD format kilobytes", () => {
      expect(formatBytes(1024)).toBe("1.0 KB");
    });

    it("SHOULD format megabytes", () => {
      expect(formatBytes(1024 * 1024)).toBe("1.0 MB");
    });

    it("SHOULD format gigabytes", () => {
      expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB");
    });

    it("SHOULD format fractional sizes", () => {
      expect(formatBytes(1536)).toBe("1.5 KB");
    });
  });

  describe("truncate", () => {
    it("SHOULD return original string when within limit", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("SHOULD truncate long strings with ellipsis", () => {
      expect(truncate("hello world", 8)).toBe("hello...");
    });

    it("SHOULD return original when exactly at limit", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });
  });

  describe("padRight", () => {
    it("SHOULD pad string to specified length", () => {
      expect(padRight("hi", 5)).toBe("hi   ");
    });

    it("SHOULD not truncate strings longer than length", () => {
      expect(padRight("hello world", 5)).toBe("hello world");
    });
  });
});
