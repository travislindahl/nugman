import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  default: {
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
  },
}));

import fs from "node:fs/promises";
import * as configService from "@/services/app-config.js";

const fsMock = vi.mocked(fs);

describe("[Unit] AppConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("loadConfig", () => {
    it("SHOULD return default config when file does not exist", async () => {
      fsMock.readFile.mockRejectedValue(new Error("ENOENT"));
      const config = await configService.loadConfig();
      expect(config.localSourceName).toBe("nugman-local");
      expect(config.localSourceDir).toContain("local-source");
    });

    it("SHOULD merge saved config with defaults", async () => {
      fsMock.readFile.mockResolvedValue(JSON.stringify({ localSourceName: "custom-name" }));
      const config = await configService.loadConfig();
      expect(config.localSourceName).toBe("custom-name");
      expect(config.localSourceDir).toContain("local-source");
    });
  });

  describe("saveConfig", () => {
    it("SHOULD create config directory and write file", async () => {
      await configService.saveConfig({
        localSourceDir: "/path/to/source",
        localSourceName: "test-source",
      });
      expect(fsMock.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(fsMock.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("config.json"),
        expect.stringContaining("test-source"),
        "utf8",
      );
    });
  });

  describe("getConfigDir", () => {
    it("SHOULD return a path containing nugman", () => {
      const dir = configService.getConfigDir();
      expect(dir).toContain("nugman");
    });
  });
});
