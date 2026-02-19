import type { NuGetSource, NuGetCacheLocation, CacheType } from "../types.js";

const VALID_CACHE_TYPES = new Set<string>([
  "http-cache",
  "global-packages",
  "temp",
  "plugins-cache",
]);

export function parseSourceList(output: string): NuGetSource[] {
  const sources: NuGetSource[] = [];
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const match = line.match(/^\s*\d+\.\s+(.+?)\s+\[(Enabled|Disabled)\]\s*$/);
    if (!match) continue;

    const name = match[1]!;
    const enabled = match[2] === "Enabled";
    const urlLine = lines[i + 1];
    const url = urlLine?.trim() ?? "";

    if (url) {
      sources.push({
        name,
        url,
        enabled,
        configLevel: "user",
        isManaged: false,
      });
    }
  }

  return sources;
}

export function parseCacheLocals(output: string): NuGetCacheLocation[] {
  const locations: NuGetCacheLocation[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    const stripped = line.replace(/^info\s*:\s*/, "").trim();
    if (!stripped) continue;

    const separatorIndex = stripped.indexOf(": ");
    if (separatorIndex === -1) continue;

    const type = stripped.slice(0, separatorIndex);
    const path = stripped.slice(separatorIndex + 2);

    if (VALID_CACHE_TYPES.has(type)) {
      locations.push({
        type: type as CacheType,
        path,
        diskUsageBytes: 0,
      });
    }
  }

  return locations;
}
