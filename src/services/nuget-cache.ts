import fs from "node:fs/promises";
import path from "node:path";
import type { NuGetCacheLocation, CacheType, CacheEntry, ClearResult } from "../types.js";
import { exec } from "./dotnet-cli.js";
import { parseCacheLocals } from "../lib/parse-cli-output.js";

export async function listCacheLocations(): Promise<readonly NuGetCacheLocation[]> {
  const output = await exec(["nuget", "locals", "all", "--list", "--force-english-output"]);
  const locations = parseCacheLocals(output);

  const withUsage = await Promise.all(
    locations.map(async (loc) => ({
      ...loc,
      diskUsageBytes: await calculateDiskUsage(loc.path),
    })),
  );
  return withUsage;
}

export async function calculateDiskUsage(dirPath: string): Promise<number> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isFile()) {
        const stat = await fs.stat(fullPath);
        total += stat.size;
      } else if (entry.isDirectory()) {
        total += await calculateDiskUsage(fullPath);
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export async function listCacheContents(dirPath: string): Promise<readonly CacheEntry[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const results: CacheEntry[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.stat(fullPath);
      results.push({
        name: entry.name,
        path: fullPath,
        sizeBytes: entry.isFile() ? stat.size : 0,
        isDirectory: entry.isDirectory(),
      });
    }
    return results;
  } catch {
    return [];
  }
}

export async function clearCache(type: CacheType): Promise<ClearResult> {
  try {
    const output = await exec(["nuget", "locals", type, "--clear"]);
    return { success: true, message: output.trim() };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to clear cache",
    };
  }
}

export async function clearAllCaches(): Promise<ClearResult> {
  try {
    const output = await exec(["nuget", "locals", "all", "--clear"]);
    return { success: true, message: output.trim() };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to clear caches",
    };
  }
}
