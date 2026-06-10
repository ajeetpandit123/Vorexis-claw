import chalk from "chalk";
import boxen from "boxen";

export function getHelpText(): string {
  return boxen(
    [
      chalk.hex("#e8dcf8").bold("⚡ VOREXIS CLAW HELP"),
      "",
      chalk.white("Examples:"),
      chalk.dim("  Build JWT authentication"),
      chalk.dim("  Create MERN ecommerce application"),
      chalk.dim("  What's inside README.md?"),
      chalk.dim("  Create deployment roadmap"),
      "",
      chalk.white("Keyboard Shortcuts:"),
      chalk.dim("  V          Voice input"),
      chalk.dim("  Ctrl+C     Exit prompt / session"),
      chalk.dim("  ESC        Cancel voice recording"),
      "",
      chalk.white("Slash Commands:"),
      chalk.dim("  /help      Show this help"),
      chalk.dim("  /clear     Clear terminal"),
      chalk.dim("  /history   Show session history"),
      chalk.dim("  /status    Project status"),
      chalk.dim("  /context   Full project context"),
      chalk.dim("  /reset     Reset session memory"),
      chalk.dim("  /exit      Exit session"),
    ].join("\n"),
    {
      padding: 1,
      borderColor: "#5b4d9e",
      borderStyle: "round",
    }
  );
}

export function printHelp(): void {
  console.log(getHelpText());
}
