import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/services/dotnet-cli.js", () => ({
  exec: vi.fn().mockResolvedValue(""),
  checkAvailability: vi.fn().mockResolvedValue({ available: true }),
}));

vi.mock("@/services/nuget-source.js", () => ({
  listSources: vi.fn().mockResolvedValue([]),
  addSource: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue([]),
    stat: vi.fn().mockResolvedValue({ size: 1024 }),
    unlink: vi.fn().mockResolvedValue(undefined),
    copyFile: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue(new Error("not found")),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

import * as localSource from "@/services/local-source.js";
import * as sourceService from "@/services/nuget-source.js";
import fs from "node:fs/promises";

describe("[Unit] LocalSourceService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initialize", () => {
    it("SHOULD create directory and register source WHEN source not found", async () => {
      vi.mocked(sourceService.listSources).mockResolvedValue([]);
      await localSource.initialize();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(sourceService.addSource).toHaveBeenCalledWith(
        "nugman-local",
        expect.stringContaining("local-source"),
      );
    });

    it("SHOULD not register source WHEN source already exists", async () => {
      vi.mocked(sourceService.listSources).mockResolvedValue([
        {
          name: "nugman-local",
          url: "/some/path",
          enabled: true,
          configLevel: "user",
          isManaged: true,
        },
      ]);
      await localSource.initialize();

      expect(fs.mkdir).toHaveBeenCalled();
      expect(sourceService.addSource).not.toHaveBeenCalled();
    });
  });

  describe("listPackages", () => {
    it("SHOULD return empty array WHEN directory is empty", async () => {
      // initialize first so config is cached
      vi.mocked(sourceService.listSources).mockResolvedValue([
        { name: "nugman-local", url: "/path", enabled: true, configLevel: "user", isManaged: true },
      ]);
      await localSource.initialize();

      vi.mocked(fs.readdir).mockResolvedValue(
        [] as unknown as Awaited<ReturnType<typeof fs.readdir>>,
      );
      const packages = await localSource.listPackages();
      expect(packages).toHaveLength(0);
    });
  });

  describe("removePackage", () => {
    it("SHOULD delete the file at the given path", async () => {
      await localSource.removePackage("/some/path/package.nupkg");
      expect(fs.unlink).toHaveBeenCalledWith("/some/path/package.nupkg");
    });
  });
});
