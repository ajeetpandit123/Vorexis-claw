import chalk from "chalk"
import { confirm, isCancel, text } from "@clack/prompts";
import { ToolLoopAgent, stepCountIs, tool } from "ai"

import { getAgentModel } from "../../AI/ai.config.ts";
import { actionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { renderTerminalMarkdown, } from "../../tui/terminal-md.ts";
import { runApprovalFlow } from "../agent/approval.ts";
import { createAgentTools } from "../agent/agent-tools.ts";
import { printPlan, selectSteps } from "./selection.ts";
import { generatePlan } from "./planner.ts";
import type { Plan, PlanStep } from "./types.ts";
import { createWebTools } from "./webtool.ts";


function stepPrompt(goal: string, step: PlanStep): string {
  return [`Goal: ${goal}`, `Step: ${step.title}`, step.description].join('\n');
}


export async function runPlanMode(): Promise<void> {

  console.log(chalk.green("Starting plan mode..."));

  const goal = await text({
    message: "What would you like to achieve?",

  })

  if (isCancel(goal) || !goal.trim()) return;

  const plan = await generatePlan(goal);


  printPlan(plan);

  const selected = await selectSteps(plan);
  if (selected.length === 0) return;


  const proceed = await confirm({
    message: `You have selected ${selected.length} step(s). Do you want to proceed with executing them ?`,
    initialValue: true,
  })

  const config = defaultAgentConfig();
  const tracker = new actionTracker();
  const executor = new ToolExecutor(tracker, config);
  const tools = {
    // Add web tools if available
     ...createAgentTools(executor),
    ...createWebTools(tracker)
  }

  for (const step of selected) {
    console.log(chalk.cyan(`\n🚀 Executing step: ${step.title}\n`));


    const agent = new ToolLoopAgent({
      model: getAgentModel(),
      stopWhen: stepCountIs(20),
      tools
    });

    const result = await agent.generate({
      prompt: stepPrompt(plan.goal, step),
    })

    if (result.text?.trim()) {
      console.log(chalk.green(`\n✅ Completed step: ${step.title}\n`));
      console.log(renderTerminalMarkdown(result.text));
    }








  }

  const ok = await runApprovalFlow(tracker);

  if (!ok) {
    return executor.clearStaging();
  }

  const { errors } = executor.applyApprovedFromTracker();
  if (errors.length) {
    console.log(chalk.red('\nSome operations reported errors:\n'));
    for (const e of errors) console.log(chalk.red(`  • ${e}`));
  } else {
    console.log(chalk.green('\n✓ Applied.\n'));
  }
  executor.clearStaging();

}