import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dotnetCli from "@/services/dotnet-cli.js";
import * as searchService from "@/services/package-search.js";

vi.mock("@/services/dotnet-cli.js", () => ({
  exec: vi.fn(),
}));

const execMock = vi.mocked(dotnetCli.exec);

describe("[Unit] PackageSearchService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("search", () => {
    it("SHOULD parse JSON search results", async () => {
      execMock.mockResolvedValue(
        JSON.stringify({
          version: 2,
          problems: [],
          searchResult: [
            {
              sourceName: "https://api.nuget.org/v3/index.json",
              packages: [
                {
                  id: "Newtonsoft.Json",
                  latestVersion: "13.0.3",
                  totalDownloads: 4456137550,
                  owners: "dotnetfoundation",
                },
              ],
            },
          ],
        }),
      );

      const results = await searchService.search("Newtonsoft");
      expect(results).toHaveLength(1);
      expect(results[0]!.sourceName).toBe("https://api.nuget.org/v3/index.json");
      expect(results[0]!.packages).toHaveLength(1);
      expect(results[0]!.packages[0]!.id).toBe("Newtonsoft.Json");
    });

    it("SHOULD pass search options to CLI args", async () => {
      execMock.mockResolvedValue(JSON.stringify({ version: 2, problems: [], searchResult: [] }));

      await searchService.search("test", { take: 10, prerelease: true });
      expect(execMock).toHaveBeenCalledWith([
        "package",
        "search",
        "test",
        "--format",
        "json",
        "--take",
        "10",
        "--prerelease",
      ]);
    });
  });
});
