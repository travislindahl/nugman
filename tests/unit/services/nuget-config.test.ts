import { describe, it, expect, vi, beforeEach } from "vitest";
import * as configService from "@/services/nuget-config.js";

vi.mock("node:fs/promises", () => ({
  default: {
    access: vi.fn().mockRejectedValue(new Error("not found")),
    readFile: vi.fn().mockResolvedValue(`<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
  </packageSources>
</configuration>`),
  },
}));

describe("[Unit] NuGetConfigService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readConfigFile", () => {
    it("SHOULD parse sources from config XML", async () => {
      const contents = await configService.readConfigFile("/path/to/nuget.config");
      expect(contents.sources).toHaveLength(1);
      expect(contents.sources[0]!.name).toBe("nuget.org");
      expect(contents.sources[0]!.value).toBe("https://api.nuget.org/v3/index.json");
    });
  });

  describe("computeOverrides", () => {
    it("SHOULD detect overrides between config files", async () => {
      const overrides = await configService.computeOverrides([
        {
          path: "/a/nuget.config",
          level: "solution",
          readable: true,
          contents: {
            sources: [{ name: "src", value: "https://a.com" }],
            disabledSources: [],
            packageSourceMappings: [],
            otherSettings: new Map(),
          },
        },
        {
          path: "/b/nuget.config",
          level: "user",
          readable: true,
          contents: {
            sources: [{ name: "src", value: "https://b.com" }],
            disabledSources: [],
            packageSourceMappings: [],
            otherSettings: new Map(),
          },
        },
      ]);
      expect(overrides).toHaveLength(1);
      expect(overrides[0]!.setting).toBe("src");
      expect(overrides[0]!.value).toBe("https://b.com");
      expect(overrides[0]!.previousValue).toBe("https://a.com");
    });
  });

  describe("listConfigFiles", () => {
    it("SHOULD return empty array WHEN no config files exist", async () => {
      const files = await configService.listConfigFiles();
      expect(files).toHaveLength(0);
    });
  });
});
