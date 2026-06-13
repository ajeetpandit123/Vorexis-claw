import chalk from "chalk";
import boxen from "boxen";

import { loadConfig } from "../../config/config.ts";
import { getModelProvider } from "../../platform/providers/manager.ts";

const COMPOSER_WIDTH = 66;

export function getComposerModelLabel(): string {
  const config = loadConfig();
  const provider = getModelProvider();
  let model = config.modelName;

  if (!model) {
    if (provider === "ollama") model = "qwen2.5:7b";
    else if (provider === "lmstudio") model = "local-model";
    else if (provider === "openrouter") model = "auto-route";
    else model = provider;
  }

  const label = `${provider} · ${model}`;
  return label.length > 32 ? `${label.slice(0, 29)}...` : label;
}

export function printComposer(options: {
  placeholder?: string;
  modelLabel?: string;
  recording?: boolean;
}): void {
  const placeholder =
    options.placeholder ?? "Plan, Build, fix, understand, or plan...";
  const modelLabel = options.modelLabel ?? getComposerModelLabel();
  const micLabel = options.recording
    ? chalk.bgHex("#7c3aed").white.bold("  🎤  ")
    : chalk.hex("#a78bfa").bgHex("#1e1b4b")("  🎤  ");

  const footerLeft = `${chalk.hex("#a78bfa")("∞")} ${chalk.white("Agent")} ${chalk.dim("▾")}`;
  const footerRight = `${micLabel} ${chalk.dim("Tab")}`;
  const gap = Math.max(2, COMPOSER_WIDTH - footerLeft.length - footerRight.length - 6);
  const footer = `${footerLeft}${" ".repeat(gap)}${footerRight}`;

  const body = [chalk.dim(placeholder), "", footer].join("\n");

  console.log(
    boxen(body, {
      borderColor: "#5b4d9e",
      borderStyle: "round",
      padding: { top: 0, bottom: 0, left: 1, right: 1 },
      width: COMPOSER_WIDTH,
      title: chalk.dim("Composer"),
      titleAlignment: "left",
    })
  );
}

export function printComposerInputLine(buffer: string, recording: boolean): void {
  if (recording) {
    console.log(chalk.red("🎙 Recording…  ENTER stop · ESC cancel"));
    return;
  }
  process.stdout.write(`${chalk.dim(">")} ${buffer}`);
}
