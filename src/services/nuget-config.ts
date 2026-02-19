import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { XMLParser } from "fast-xml-parser";
import type {
  NuGetConfigFile,
  NuGetConfigContents,
  ConfigFileLevel,
  ConfigOverride,
  ConfigSourceEntry,
  PackageSourceMapping,
} from "../types.js";

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function listConfigFiles(): Promise<readonly NuGetConfigFile[]> {
  const files: NuGetConfigFile[] = [];

  // User-level config
  const userConfig = path.join(os.homedir(), ".nuget", "NuGet", "NuGet.Config");
  await addConfigFile(files, userConfig, "user");

  // Walk up from cwd looking for nuget.config
  let dir = process.cwd();
  const root = path.parse(dir).root;
  while (dir !== root) {
    const configPath = path.join(dir, "nuget.config");
    await addConfigFile(files, configPath, "solution");
    dir = path.dirname(dir);
  }

  return files;
}

async function addConfigFile(
  files: NuGetConfigFile[],
  configPath: string,
  level: ConfigFileLevel,
): Promise<void> {
  try {
    await fs.access(configPath);
    try {
      const contents = await readConfigFile(configPath);
      files.push({ path: configPath, level, readable: true, contents });
    } catch (err) {
      files.push({
        path: configPath,
        level,
        readable: false,
        error: err instanceof Error ? err.message : "Failed to read config",
      });
    }
  } catch {
    // File doesn't exist, skip
  }
}

export async function readConfigFile(configPath: string): Promise<NuGetConfigContents> {
  const xml = await fs.readFile(configPath, "utf8");
  const parsed = xmlParser.parse(xml);
  const config = parsed?.configuration ?? {};

  const sources = parseSourceEntries(config.packageSources);
  const disabledSources = parseDisabledSources(config.disabledPackageSources);
  const packageSourceMappings = parseMappings(config.packageSourceMapping);

  return {
    sources,
    disabledSources,
    packageSourceMappings,
    otherSettings: new Map(),
  };
}

export async function computeOverrides(
  files: readonly NuGetConfigFile[],
): Promise<readonly ConfigOverride[]> {
  const overrides: ConfigOverride[] = [];
  const seen = new Map<string, { value: string; file: string }>();

  for (const file of files) {
    if (!file.contents) continue;
    for (const source of file.contents.sources) {
      const key = `packageSources.${source.name}`;
      const existing = seen.get(key);
      if (existing) {
        overrides.push({
          setting: source.name,
          section: "packageSources",
          overriddenBy: file.path,
          overrides: existing.file,
          value: source.value,
          previousValue: existing.value,
        });
      }
      seen.set(key, { value: source.value, file: file.path });
    }
  }

  return overrides;
}

function parseSourceEntries(sources: unknown): readonly ConfigSourceEntry[] {
  if (!sources || typeof sources !== "object") return [];
  const s = sources as Record<string, unknown>;
  const adds = Array.isArray(s.add) ? s.add : s.add ? [s.add] : [];
  return (adds as Record<string, unknown>[]).map((a) => ({
    name: String(a["@_key"] ?? ""),
    value: String(a["@_value"] ?? ""),
    protocolVersion: a["@_protocolVersion"] ? String(a["@_protocolVersion"]) : undefined,
  }));
}

function parseDisabledSources(disabled: unknown): readonly string[] {
  if (!disabled || typeof disabled !== "object") return [];
  const d = disabled as Record<string, unknown>;
  const adds = Array.isArray(d.add) ? d.add : d.add ? [d.add] : [];
  return (adds as Record<string, unknown>[])
    .filter((a) => String(a["@_value"]) === "true")
    .map((a) => String(a["@_key"] ?? ""));
}

function parseMappings(mappings: unknown): readonly PackageSourceMapping[] {
  if (!mappings || typeof mappings !== "object") return [];
  const m = mappings as Record<string, unknown>;
  const sources = Array.isArray(m.packageSource)
    ? m.packageSource
    : m.packageSource
      ? [m.packageSource]
      : [];
  return (sources as Record<string, unknown>[]).map((s) => {
    const packages = Array.isArray(s.package) ? s.package : s.package ? [s.package] : [];
    return {
      sourceKey: String(s["@_key"] ?? ""),
      patterns: (packages as Record<string, unknown>[]).map((p) => String(p["@_pattern"] ?? "")),
    };
  });
}
