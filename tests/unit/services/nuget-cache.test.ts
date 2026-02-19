import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dotnetCli from "@/services/dotnet-cli.js";
import * as cacheService from "@/services/nuget-cache.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  exec: vi.fn(),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn().mockResolvedValue({ size: 0 }),
  },
}));

const execMock = vi.mocked(dotnetCli.exec);

describe("[Unit] NuGetCacheService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listCacheLocations", () => {
    it("SHOULD parse cache locations from CLI output", async () => {
      execMock.mockResolvedValue(
        `info : http-cache: /tmp/cache
info : global-packages: /tmp/packages
info : temp: /tmp/scratch
info : plugins-cache: /tmp/plugins
`,
      );

      const locations = await cacheService.listCacheLocations();
      expect(locations).toHaveLength(4);
      expect(locations[0]!.type).toBe("http-cache");
      expect(locations[0]!.path).toBe("/tmp/cache");
    });
  });

  describe("clearCache", () => {
    it("SHOULD return success when clear succeeds", async () => {
      execMock.mockResolvedValue("Clearing NuGet HTTP cache: /tmp/cache\n  OK");
      const result = await cacheService.clearCache("http-cache");
      expect(result.success).toBe(true);
    });

    it("SHOULD return failure when clear throws", async () => {
      execMock.mockRejectedValue(new Error("Permission denied"));
      const result = await cacheService.clearCache("http-cache");
      expect(result.success).toBe(false);
      expect(result.message).toContain("Permission denied");
    });
  });

  describe("clearAllCaches", () => {
    it("SHOULD call dotnet nuget locals all --clear", async () => {
      execMock.mockResolvedValue("All caches cleared");
      const result = await cacheService.clearAllCaches();
      expect(result.success).toBe(true);
      expect(execMock).toHaveBeenCalledWith(["nuget", "locals", "all", "--clear"]);
    });
  });
});
