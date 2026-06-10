import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";
import { runAgentMode } from "./agent/orchestrator";
import { runAskMode } from "./ask/orchestrator";
import { runPlanMode } from "./plan/orchestrator";

export async function runCliMode() {
  while (true) {
    const mode = await select({
      message: "choose CLI sub-mode",
      options: [
        { value: "agent", label: "Agent Mode" },
        { value: "plan", label: "Plan Mode" },
        { value: "ask", label: "Ask Mode" },
        { value: "back", label: "Back to Main Menu" }
      ]
    });

    if (isCancel(mode) || mode === "back") return;

    if (mode === "agent") {
      await runAgentMode();
    } else if (mode === "plan") {
      await runPlanMode();
    } else if (mode === "ask") {
      await runAskMode();
    } else {
      console.log(chalk.red("Invalid mode selected. Please try again."));
    }
  }
}
