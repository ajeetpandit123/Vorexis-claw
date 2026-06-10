import chalk from "chalk";

import { showOnboardingError } from "../config/config.ts";
import { hasProviderCredentials } from "../platform/providers/manager.ts";
import { detectProjectContext, formatProjectContext } from "../core/project-context.ts";
import { SessionMemory } from "../core/session-memory.ts";
import { routePrompt } from "../engine/router.ts";
import { promptWithVoice } from "../modes/voice/prompt-input.ts";
import { printStartupBanner } from "./banner.ts";
import { printHelp } from "./help.ts";

type SlashResult = "continue" | "exit";

function handleSlashCommand(
  input: string,
  memory: SessionMemory,
  project: ReturnType<typeof detectProjectContext>
): SlashResult {
  const command = input.trim().toLowerCase();

  switch (command) {
    case "/help":
      printHelp();
      return "continue";
    case "/clear":
      console.clear();
      printStartupBanner(project);
      return "continue";
    case "/history": {
      const history = memory.getHistory();
      if (history.length === 0) {
        console.log(chalk.dim("\nNo session history yet.\n"));
        return "continue";
      }
      console.log(chalk.hex("#5b4d9e").bold("\nSession History\n"));
      for (const turn of history) {
        const label = turn.role === "user" ? chalk.cyan("You") : chalk.green("Claw");
        const intent = turn.intent ? chalk.dim(` [${turn.intent}]`) : "";
        console.log(`${label}${intent}: ${turn.content.slice(0, 200)}${turn.content.length > 200 ? "..." : ""}`);
      }
      console.log();
      return "continue";
    }
    case "/status":
      console.log(chalk.hex("#5b4d9e").bold("\nProject Status\n"));
      console.log(chalk.dim(`Project    : ${project.name}`));
      console.log(chalk.dim(`Framework  : ${project.framework}`));
      console.log(chalk.dim(`Branch     : ${project.gitBranch}`));
      console.log(chalk.dim(`Status     : ${project.gitStatus}`));
      console.log(chalk.dim(`Memory     : ${memory.getHistory().length} turn(s)\n`));
      return "continue";
    case "/context":
      console.log(chalk.hex("#5b4d9e").bold("\nProject Context\n"));
      console.log(chalk.dim(formatProjectContext(project)));
      console.log();
      return "continue";
    case "/reset":
      memory.clear();
      console.log(chalk.green("\n✓ Session memory cleared.\n"));
      return "continue";
    case "/exit":
      console.log(chalk.dim("\nGoodbye.\n"));
      return "exit";
    default:
      console.log(chalk.yellow(`\nUnknown command: ${input}. Type /help for available commands.\n`));
      return "continue";
  }
}

export async function runSession(): Promise<void> {
  if (!hasProviderCredentials()) {
    showOnboardingError();
    return;
  }

  const project = detectProjectContext();
  const memory = new SessionMemory();

  printStartupBanner(project);

  let firstPrompt = true;

  while (true) {
    const input = await promptWithVoice({
      message: firstPrompt ? "" : chalk.dim("Continue..."),
      placeholder: firstPrompt ? undefined : "Type or press V to speak",
      continuation: !firstPrompt,
    });

    firstPrompt = false;

    if (input === null) {
      console.log(chalk.dim("\nGoodbye.\n"));
      break;
    }

    if (input.startsWith("/")) {
      const result = handleSlashCommand(input, memory, project);
      if (result === "exit") break;
      continue;
    }

    if (input.toLowerCase() === "help" || input.toLowerCase() === "--help") {
      printHelp();
      continue;
    }

    await routePrompt(input, memory);
    console.log();
  }
}
