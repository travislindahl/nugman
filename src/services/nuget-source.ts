import { stat } from "node:fs/promises";
import type { NuGetSource, SourceHealthResult } from "../types.js";
import { exec } from "./dotnet-cli.js";
import { parseSourceList } from "../lib/parse-cli-output.js";

export async function listSources(): Promise<readonly NuGetSource[]> {
  const output = await exec(["nuget", "list", "source", "--format", "Detailed"]);
  return parseSourceList(output);
}

export async function addSource(name: string, url: string): Promise<void> {
  await exec(["nuget", "add", "source", url, "--name", name]);
}

export async function updateSource(name: string, newName?: string, newUrl?: string): Promise<void> {
  const args = ["nuget", "update", "source", name];
  if (newUrl) args.push("--source", newUrl);
  if (newName) args.push("--name", newName);
  await exec(args);
}

export async function removeSource(name: string): Promise<void> {
  await exec(["nuget", "remove", "source", name]);
}

export async function enableSource(name: string): Promise<void> {
  await exec(["nuget", "enable", "source", name]);
}

export async function disableSource(name: string): Promise<void> {
  await exec(["nuget", "disable", "source", name]);
}

function isLocalSource(url: string): boolean {
  return !url.startsWith("http://") && !url.startsWith("https://");
}

async function checkLocalHealth(source: NuGetSource): Promise<SourceHealthResult> {
  const start = Date.now();
  try {
    const info = await stat(source.url);
    const responseTimeMs = Date.now() - start;
    return info.isDirectory()
      ? { sourceName: source.name, status: "healthy", responseTimeMs }
      : { sourceName: source.name, status: "unhealthy", responseTimeMs, error: "Not a directory" };
  } catch {
    const responseTimeMs = Date.now() - start;
    return {
      sourceName: source.name,
      status: "unhealthy",
      responseTimeMs,
      error: "Path not found",
    };
  }
}

export async function checkHealth(source: NuGetSource): Promise<SourceHealthResult> {
  if (!source.enabled) {
    return { sourceName: source.name, status: "disabled" };
  }

  if (isLocalSource(source.url)) {
    return checkLocalHealth(source);
  }

  const start = Date.now();
  try {
    const response = await fetch(source.url, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    const responseTimeMs = Date.now() - start;
    return response.ok
      ? { sourceName: source.name, status: "healthy", responseTimeMs }
      : {
          sourceName: source.name,
          status: "unhealthy",
          responseTimeMs,
          error: `HTTP ${response.status}`,
        };
  } catch (err) {
    const responseTimeMs = Date.now() - start;
    const error = err instanceof Error ? err.message : "Unknown error";
    return { sourceName: source.name, status: "unhealthy", responseTimeMs, error };
  }
}

export async function checkAllHealth(
  sources: readonly NuGetSource[],
): Promise<readonly SourceHealthResult[]> {
  return Promise.all(sources.map((s) => checkHealth(s)));
}
