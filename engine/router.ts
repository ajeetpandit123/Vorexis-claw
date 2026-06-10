import chalk from "chalk";
import ora from "ora";

import { detectIntent, intentLabel, type Intent } from "./intent.ts";
import { SessionMemory } from "../core/session-memory.ts";
import { runAsk } from "../modes/ask/orchestrator.ts";
import { runPlan } from "../modes/plan/orchestrator.ts";
import { runAgent } from "../modes/agent/orchestrator.ts";
import { renderTerminalMarkdown } from "../tui/terminal-md.ts";
import { speakResponse } from "../modes/voice/speak-response.ts";
import { printHelp } from "../tui/help.ts";

export interface RouteResult {
  intent: Intent;
  response: string;
  prompt: string;
}

async function executeIntent(intent: Intent, prompt: string): Promise<string> {
  switch (intent) {
    case "ASK":
      return runAsk(prompt);
    case "PLAN":
      return runPlan(prompt);
    case "AGENT":
      return runAgent(prompt, undefined, { intent });
    case "HELP":
      return "";
  }
}

export async function routePrompt(
  rawPrompt: string,
  memory: SessionMemory
): Promise<RouteResult | null> {
  const prompt = rawPrompt.trim();
  if (!prompt) return null;

  const intent = detectIntent(prompt);

  if (intent === "HELP") {
    printHelp();
    return null;
  }

  const contextualPrompt = memory.wrapPrompt(prompt);
  const spinner = ora({
    text: chalk.hex("#e8dcf8")(`Routing to ${intentLabel(intent)} engine...`),
    color: "magenta",
  }).start();

  try {
    const response = await executeIntent(intent, contextualPrompt);
    spinner.succeed(chalk.hex("#5b4d9e")(`${intentLabel(intent)} complete`));

    memory.addUser(prompt, intent);
    memory.addAssistant(response);

    console.log(chalk.hex("#5b4d9e")("─".repeat(52)));
    console.log(renderTerminalMarkdown(response));
    console.log(chalk.hex("#5b4d9e")("─".repeat(52)));

    await speakResponse(response);

    return { intent, response, prompt };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    spinner.fail(chalk.red(`Execution failed: ${message}`));
    return null;
  }
}
