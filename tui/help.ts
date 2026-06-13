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
      chalk.white("Composer:"),
      chalk.dim("  Type your prompt in the composer bar"),
      chalk.dim("  Tab + 🎤          Start voice recording"),
      chalk.dim("  ENTER             Submit typed prompt / stop recording"),
      chalk.dim("  ESC               Cancel voice recording"),
      chalk.dim("  Ctrl+C            Exit session"),
      "",
      chalk.white("Slash Commands:"),
      chalk.dim("  /help      Show this help"),
      chalk.dim("  /clear     Clear terminal"),
      chalk.dim("  /history   Show session history"),
      chalk.dim("  /status    Project status"),
      chalk.dim("  /context   Full project context"),
      chalk.dim("  /reset     Reset session memory"),
      chalk.dim("  /exit      Exit session"),
      "",
      chalk.white("Platform Commands:"),
      chalk.dim("  vorexis-claw telegram       Remote bot (/ask /plan /agent)"),
      chalk.dim("  vorexis-claw github login|status"),
      chalk.dim("  vorexis-claw mcp list|connect|status"),
      chalk.dim("  vorexis-claw provider set ollama"),
      chalk.dim("  vorexis-claw doctor"),
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
