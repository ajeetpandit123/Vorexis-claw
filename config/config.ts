import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";

export interface VorexisConfig {
  openrouterApiKey?: string;
}

export function getConfigPath(): string {
  return path.join(
    homedir(),
    ".vorexis-claw",
    "config.json"
  );
}

export function ensureConfigDir(): void {
  const dir = path.dirname(getConfigPath());

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig(): VorexisConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    const data = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(data) as VorexisConfig;
  } catch (error) {
    return {};
  }
}

export function saveConfig(config: VorexisConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function deleteConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}
