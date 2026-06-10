import chalk from "chalk"
import { confirm, isCancel } from "@clack/prompts";
import { ToolLoopAgent, stepCountIs, tool } from "ai"

import { getAgentModel } from "../../AI/ai.config.ts";
import { actionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { renderTerminalMarkdown, } from "../../tui/terminal-md.ts";
import { runApprovalFlow } from "../agent/approval.ts";
import { createAgentTools } from "../agent/agent-tools.ts";
import { printPlan } from "./selection.ts";
import { generatePlan } from "./planner.ts";
import type { Plan, PlanStep } from "./types.ts";
import { createWebTools } from "./webtool.ts";


function stepPrompt(goal: string, step: PlanStep): string {
  return [`Goal: ${goal}`, `Step: ${step.title}`, step.description].join('\n');
}


export async function runPlan(
  goal: string,
  confirmStepFn?: (numSteps: number) => Promise<boolean>
): Promise<string> {
  const plan = await generatePlan(goal);
  printPlan(plan);

  const selected = plan.steps;
  if (selected.length === 0) return "No steps generated in the plan.";

  let proceed = true;
  if (confirmStepFn) {
    proceed = await confirmStepFn(selected.length);
  } else {
    const res = await confirm({
      message: `You have selected ${selected.length} step(s). Do you want to proceed with executing them?`,
      initialValue: true,
    });
    proceed = !isCancel(res) && res;
  }

  if (!proceed) return "Plan execution cancelled.";

  const config = defaultAgentConfig();
  const tracker = new actionTracker();
  const executor = new ToolExecutor(tracker, config);
  const tools = {
    ...createAgentTools(executor),
    ...createWebTools(tracker)
  };

  let summary = "";
  for (const step of selected) {
    console.log(chalk.cyan(`\n🚀 Executing step: ${step.title}\n`));

    const agent = new ToolLoopAgent({
      model: getAgentModel(),
      stopWhen: stepCountIs(20),
      tools,
      maxOutputTokens: 4000,
    });

    const result = await agent.generate({
      prompt: stepPrompt(plan.goal, step),
    });

    if (result.text?.trim()) {
      console.log(chalk.green(`\n✅ Completed step: ${step.title}\n`));
      console.log(renderTerminalMarkdown(result.text));
      summary += `\n### Step: ${step.title}\n${result.text}\n`;
    }
  }

  const ok = await runApprovalFlow(tracker);
  if (!ok) {
    executor.clearStaging();
    return summary + "\nChanges were discarded.";
  }

  const { errors } = executor.applyApprovedFromTracker();
  if (errors.length) {
    let errStr = '\nSome operations reported errors:\n';
    for (const e of errors) errStr += `  • ${e}\n`;
    console.log(chalk.red(errStr));
    summary += errStr;
  } else {
    console.log(chalk.green('\n✓ Applied.\n'));
    summary += "\n✓ Applied all changes successfully.\n";
  }
  executor.clearStaging();
  return summary;
}