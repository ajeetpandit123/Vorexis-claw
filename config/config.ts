import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import crypto from "node:crypto";

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

export function resolveApiKey(): string | undefined {
  const SHIPPED_KEY_HASH = "eca60bcada1114973fae8d6654b43d607982d66d6386bb2a9d238a4e3881ace3";
  let envKey = process.env.OPENROUTER_API_KEY;
  if (envKey) {
    const hash = crypto.createHash("sha256").update(envKey).digest("hex");
    if (hash === SHIPPED_KEY_HASH) {
      envKey = undefined;
    }
  }
  return envKey ?? loadConfig().openrouterApiKey;
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

export function showOnboardingError(): void {
  try {
    // Write to clipboard natively in Bun
    Bun.write("clipboard", "vorexis-claw login");
  } catch (e) {
    // Ignore clipboard access errors if sandbox or environment restricts it
  }

  const formatLine = (leftText: string, style: (s: string) => string = (s) => s): string => {
    const width = 56;
    const border = chalk.hex("#5b4d9e")("│");
    const visibleLength = leftText.length;
    const padding = " ".repeat(Math.max(0, width - visibleLength));
    return `${border}${style(leftText)}${padding}${border}`;
  };

  console.log();
  console.log(chalk.hex("#5b4d9e")(`┌${"─".repeat(56)}┐`));
  console.log(formatLine("  [!] No OpenRouter API key configured.", chalk.hex("#ff9e3b").bold));
  console.log(formatLine(""));
  console.log(formatLine("  Please run:"));
  console.log(formatLine(`  vorexis-claw login`, chalk.hex("#e8dcf8").bold));
  console.log(formatLine(""));
  console.log(formatLine("  (Copied to clipboard! Just paste and run)", chalk.dim));
  console.log(chalk.hex("#5b4d9e")(`└${"─".repeat(56)}┘`));
  console.log();
}
