import type { PackageSearchResult, SearchOptions } from "../types.js";
import { exec } from "./dotnet-cli.js";

export async function search(
  term: string,
  options?: SearchOptions,
): Promise<readonly PackageSearchResult[]> {
  const args = ["package", "search", term, "--format", "json"];
  if (options?.source) args.push("--source", options.source);
  if (options?.take) args.push("--take", String(options.take));
  if (options?.skip) args.push("--skip", String(options.skip));
  if (options?.prerelease) args.push("--prerelease");

  const output = await exec(args);
  const parsed = JSON.parse(output) as {
    version: number;
    problems: string[];
    searchResult: Array<{
      sourceName: string;
      packages: Array<{
        id: string;
        latestVersion: string;
        totalDownloads?: number;
        owners?: string;
      }>;
    }>;
  };

  return parsed.searchResult.map((sr) => ({
    sourceName: sr.sourceName,
    packages: sr.packages.map((p) => ({
      id: p.id,
      latestVersion: p.latestVersion,
      description: "",
      totalDownloads: p.totalDownloads,
      owners: p.owners,
    })),
  }));
}
