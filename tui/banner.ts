import chalk from "chalk";
import boxen from "boxen";
import gradient from "gradient-string";

import { type ProjectContext } from "../core/project-context.ts";
import { isVoiceEnabled } from "../modes/voice/prompt-input.ts";

export function printStartupBanner(project: ProjectContext): void {
  const title = gradient(["#5b4d9e", "#e8dcf8"]).multiline("⚡ VOREXIS CLAW");
  const subtitle = chalk.dim("Autonomous Software Engineer AI");

  console.log(
    boxen(`${title}\n${subtitle}`, {
      padding: { top: 0, bottom: 0, left: 2, right: 2 },
      borderColor: "#5b4d9e",
      borderStyle: "round",
      textAlignment: "center",
    })
  );

  console.log();
  console.log(chalk.dim(`Project        : ${chalk.white(project.name)}`));
  console.log(chalk.dim(`Framework      : ${chalk.white(project.framework)}`));
  console.log(chalk.dim(`Language       : ${chalk.white(project.language)}`));
  console.log(chalk.dim(`Package Manager: ${chalk.white(project.packageManager)}`));
  console.log(chalk.dim(`Git Branch     : ${chalk.white(project.gitBranch)}`));
  console.log(chalk.dim(`Git Status     : ${chalk.white(project.gitStatus)}`));
  console.log();
  console.log(chalk.hex("#5b4d9e")("─".repeat(52)));
  console.log();

  if (isVoiceEnabled()) {
    console.log(chalk.cyan("🎤 Voice Available"));
    console.log(chalk.dim("Type your prompt or press V to record"));
    console.log();
  }

  console.log(
    chalk.hex("#e8dcf8").bold("What would you like to build, fix, understand, or plan?")
  );
  console.log();
}
