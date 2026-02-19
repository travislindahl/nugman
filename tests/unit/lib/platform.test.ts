import { describe, it, expect, vi, afterEach } from "vitest";
import os from "node:os";

describe("[Unit] Platform", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  describe("getOS", () => {
    it("SHOULD return 'macos' on darwin", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
      const { getOS } = await import("@/lib/platform.js");
      expect(getOS()).toBe("macos");
    });

    it("SHOULD return 'windows' on win32", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("win32");
      const { getOS } = await import("@/lib/platform.js");
      expect(getOS()).toBe("windows");
    });

    it("SHOULD return 'linux' on linux", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("linux");
      const { getOS } = await import("@/lib/platform.js");
      expect(getOS()).toBe("linux");
    });
  });

  describe("getConfigDir", () => {
    it("SHOULD return macOS path on darwin", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
      vi.spyOn(os, "homedir").mockReturnValue("/Users/test");
      const { getConfigDir } = await import("@/lib/platform.js");
      expect(getConfigDir()).toBe("/Users/test/Library/Application Support/nugman");
    });

    it("SHOULD use APPDATA on windows", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("win32");
      const originalEnv = process.env.APPDATA;
      process.env.APPDATA = "C:\\Users\\test\\AppData\\Roaming";
      const { getConfigDir } = await import("@/lib/platform.js");
      expect(getConfigDir()).toContain("nugman");
      process.env.APPDATA = originalEnv;
    });
  });

  describe("getLocalSourceDir", () => {
    it("SHOULD return configDir/local-source", async () => {
      vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
      vi.spyOn(os, "homedir").mockReturnValue("/Users/test");
      const { getLocalSourceDir } = await import("@/lib/platform.js");
      expect(getLocalSourceDir()).toBe(
        "/Users/test/Library/Application Support/nugman/local-source",
      );
    });
  });
});
