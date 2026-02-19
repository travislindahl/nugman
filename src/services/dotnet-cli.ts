import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { DotnetInfo, ExecOptions } from "../types.js";

const execFileAsync = promisify(execFile);

export async function checkAvailability(): Promise<DotnetInfo> {
  try {
    const { stdout } = await execFileAsync("dotnet", ["--version"]);
    return { available: true, version: stdout.trim() };
  } catch (err) {
    const message =
      err instanceof Error && "code" in err && err.code === "ENOENT"
        ? "dotnet CLI not found on PATH"
        : err instanceof Error
          ? err.message
          : "Unknown error checking dotnet availability";
    return { available: false, error: message };
  }
}

export async function exec(args: readonly string[], options?: ExecOptions): Promise<string> {
  const { stdout } = await execFileAsync("dotnet", [...args], {
    cwd: options?.cwd,
    timeout: options?.timeoutMs,
  });
  return stdout;
}

export function spawnDotnet(
  args: readonly string[],
  onStdout: (line: string) => void,
  onStderr: (line: string) => void,
  options?: ExecOptions,
): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("dotnet", [...args], {
      cwd: options?.cwd,
    });

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (data: string) => {
      for (const line of data.split("\n")) {
        if (line) onStdout(line);
      }
    });

    child.stderr.on("data", (data: string) => {
      for (const line of data.split("\n")) {
        if (line) onStderr(line);
      }
    });

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}
