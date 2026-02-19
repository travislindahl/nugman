import fs from "node:fs/promises";
import path from "node:path";
import type { LocalSourcePackage, AddPackageResult } from "../types.js";
import { loadConfig } from "./app-config.js";
import * as sourceService from "./nuget-source.js";
import { spawnDotnet } from "./dotnet-cli.js";

let cachedConfig: { localSourceDir: string; localSourceName: string } | null = null;

async function getConfig() {
  if (!cachedConfig) {
    cachedConfig = await loadConfig();
  }
  return cachedConfig;
}

export function getLocalSourcePath(): string {
  if (cachedConfig) return cachedConfig.localSourceDir;
  // Fallback — should be initialized before use
  throw new Error("Local source not initialized. Call initialize() first.");
}

export async function initialize(): Promise<void> {
  const config = await getConfig();

  // Create directory if missing
  await fs.mkdir(config.localSourceDir, { recursive: true });

  // Check if source is registered
  const sources = await sourceService.listSources();
  const existing = sources.find((s) => s.name === config.localSourceName);
  if (!existing) {
    await sourceService.addSource(config.localSourceName, config.localSourceDir);
  }
}

export async function listPackages(): Promise<readonly LocalSourcePackage[]> {
  const config = await getConfig();
  try {
    const entries = await fs.readdir(config.localSourceDir, { withFileTypes: true });
    const packages: LocalSourcePackage[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".nupkg")) continue;
      const filePath = path.join(config.localSourceDir, entry.name);
      const stat = await fs.stat(filePath);
      // Use filename as basic identity — real metadata reading in PackageMetadataService
      const nameParts = entry.name.replace(".nupkg", "").split(".");
      const version = nameParts.length >= 4 ? nameParts.slice(-3).join(".") : "0.0.0";
      const id =
        nameParts.length >= 4 ? nameParts.slice(0, -3).join(".") : entry.name.replace(".nupkg", "");
      packages.push({
        id,
        version,
        fileName: entry.name,
        filePath,
        fileSizeBytes: stat.size,
      });
    }
    return packages;
  } catch {
    return [];
  }
}

export async function removePackage(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}

export async function removePackages(filePaths: readonly string[]): Promise<void> {
  await Promise.all(filePaths.map((fp) => fs.unlink(fp)));
}

export async function checkDuplicate(
  id: string,
  version: string,
): Promise<LocalSourcePackage | undefined> {
  const packages = await listPackages();
  return packages.find((p) => p.id.toLowerCase() === id.toLowerCase() && p.version === version);
}

export async function addPackageFromFile(nupkgPath: string): Promise<AddPackageResult> {
  const config = await getConfig();
  try {
    const fileName = path.basename(nupkgPath);
    const destPath = path.join(config.localSourceDir, fileName);

    // Simple copy
    await fs.copyFile(nupkgPath, destPath);
    const stat = await fs.stat(destPath);

    return {
      kind: "success",
      package: {
        id: fileName.replace(".nupkg", ""),
        version: "0.0.0",
        fileName,
        filePath: destPath,
        fileSizeBytes: stat.size,
      },
    };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Failed to add package",
    };
  }
}

export async function addPackageFromBuild(
  projectPath: string,
  onOutput: (line: string) => void,
): Promise<AddPackageResult> {
  const config = await getConfig();
  try {
    const exitCode = await spawnDotnet(
      ["pack", projectPath, "-o", config.localSourceDir, "-c", "Release", "--nologo"],
      onOutput,
      onOutput,
    );
    if (exitCode !== 0) {
      return { kind: "error", message: `dotnet pack exited with code ${exitCode}` };
    }

    // Scan for new .nupkg files
    const entries = await fs.readdir(config.localSourceDir);
    const nupkgFiles = entries.filter((e) => e.endsWith(".nupkg"));
    if (nupkgFiles.length === 0) {
      return { kind: "error", message: "No .nupkg files produced by build" };
    }

    const fileName = nupkgFiles[nupkgFiles.length - 1]!;
    const filePath = path.join(config.localSourceDir, fileName);
    const stat = await fs.stat(filePath);
    return {
      kind: "success",
      package: {
        id: fileName.replace(".nupkg", ""),
        version: "0.0.0",
        fileName,
        filePath,
        fileSizeBytes: stat.size,
      },
    };
  } catch (err) {
    return {
      kind: "error",
      message: err instanceof Error ? err.message : "Build failed",
    };
  }
}
