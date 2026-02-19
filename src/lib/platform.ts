import os from "node:os";
import path from "node:path";

export type OSType = "windows" | "macos" | "linux";

export function getOS(): OSType {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    default:
      return "linux";
  }
}

export function getConfigDir(): string {
  switch (getOS()) {
    case "windows":
      return path.join(process.env.APPDATA ?? os.homedir(), "nugman");
    case "macos":
      return path.join(os.homedir(), "Library", "Application Support", "nugman");
    case "linux":
      return path.join(process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), ".config"), "nugman");
  }
}

export function getLocalSourceDir(): string {
  return path.join(getConfigDir(), "local-source");
}
