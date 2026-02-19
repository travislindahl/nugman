import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dotnetCli from "@/services/dotnet-cli.js";
import * as sourceService from "@/services/nuget-source.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  exec: vi.fn(),
}));

const execMock = vi.mocked(dotnetCli.exec);

describe("[Unit] NuGetSourceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listSources", () => {
    it("SHOULD parse sources from CLI output WHEN sources are configured", async () => {
      execMock.mockResolvedValue(
        `Registered Sources:
  1.  nuget.org [Enabled]
      https://api.nuget.org/v3/index.json
  2.  MyPrivate [Disabled]
      https://myserver/nuget/v3/index.json
`,
      );

      const sources = await sourceService.listSources();
      expect(sources).toHaveLength(2);
      expect(sources[0]).toEqual({
        name: "nuget.org",
        url: "https://api.nuget.org/v3/index.json",
        enabled: true,
        configLevel: "user",
        isManaged: false,
      });
      expect(sources[1]).toEqual({
        name: "MyPrivate",
        url: "https://myserver/nuget/v3/index.json",
        enabled: false,
        configLevel: "user",
        isManaged: false,
      });
    });

    it("SHOULD return empty array WHEN no sources are configured", async () => {
      execMock.mockResolvedValue("Registered Sources:\n");
      const sources = await sourceService.listSources();
      expect(sources).toHaveLength(0);
    });
  });

  describe("addSource", () => {
    it("SHOULD call dotnet nuget add source with correct args", async () => {
      execMock.mockResolvedValue("");
      await sourceService.addSource("test", "https://test.com/nuget");
      expect(execMock).toHaveBeenCalledWith([
        "nuget",
        "add",
        "source",
        "https://test.com/nuget",
        "--name",
        "test",
      ]);
    });
  });

  describe("removeSource", () => {
    it("SHOULD call dotnet nuget remove source with correct args", async () => {
      execMock.mockResolvedValue("");
      await sourceService.removeSource("test");
      expect(execMock).toHaveBeenCalledWith(["nuget", "remove", "source", "test"]);
    });
  });

  describe("enableSource", () => {
    it("SHOULD call dotnet nuget enable source with correct args", async () => {
      execMock.mockResolvedValue("");
      await sourceService.enableSource("test");
      expect(execMock).toHaveBeenCalledWith(["nuget", "enable", "source", "test"]);
    });
  });

  describe("disableSource", () => {
    it("SHOULD call dotnet nuget disable source with correct args", async () => {
      execMock.mockResolvedValue("");
      await sourceService.disableSource("test");
      expect(execMock).toHaveBeenCalledWith(["nuget", "disable", "source", "test"]);
    });
  });

  describe("checkHealth", () => {
    it("SHOULD return disabled status for disabled sources", async () => {
      const result = await sourceService.checkHealth({
        name: "test",
        url: "https://test.com",
        enabled: false,
        configLevel: "user",
        isManaged: false,
      });
      expect(result.status).toBe("disabled");
      expect(result.sourceName).toBe("test");
    });

    it("SHOULD return healthy status for reachable sources", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
      const result = await sourceService.checkHealth({
        name: "nuget.org",
        url: "https://api.nuget.org/v3/index.json",
        enabled: true,
        configLevel: "user",
        isManaged: false,
      });
      expect(result.status).toBe("healthy");
      expect(result.responseTimeMs).toBeDefined();
      vi.unstubAllGlobals();
    });

    it("SHOULD return unhealthy status for unreachable sources", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
      const result = await sourceService.checkHealth({
        name: "bad",
        url: "https://bad.example.com",
        enabled: true,
        configLevel: "user",
        isManaged: false,
      });
      expect(result.status).toBe("unhealthy");
      expect(result.error).toContain("ECONNREFUSED");
      vi.unstubAllGlobals();
    });
  });

  describe("checkAllHealth", () => {
    it("SHOULD check all sources concurrently", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }));
      const results = await sourceService.checkAllHealth([
        { name: "a", url: "https://a.com", enabled: true, configLevel: "user", isManaged: false },
        { name: "b", url: "https://b.com", enabled: false, configLevel: "user", isManaged: false },
      ]);
      expect(results).toHaveLength(2);
      expect(results[0]!.status).toBe("healthy");
      expect(results[1]!.status).toBe("disabled");
      vi.unstubAllGlobals();
    });
  });
});
