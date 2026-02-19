import fs from "node:fs/promises";
import path from "node:path";
import type { AppConfig } from "../types.js";
import { getConfigDir, getLocalSourceDir } from "../lib/platform.js";

const CONFIG_FILE = "config.json";

function getDefaultConfig(): AppConfig {
  return {
    localSourceDir: getLocalSourceDir(),
    localSourceName: "nugman-local",
  };
}

export { getConfigDir };

export async function loadConfig(): Promise<AppConfig> {
  const configPath = path.join(getConfigDir(), CONFIG_FILE);
  try {
    const data = await fs.readFile(configPath, "utf8");
    return { ...getDefaultConfig(), ...JSON.parse(data) } as AppConfig;
  } catch {
    return getDefaultConfig();
  }
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const configDir = getConfigDir();
  await fs.mkdir(configDir, { recursive: true });
  const configPath = path.join(configDir, CONFIG_FILE);
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf8");
}
