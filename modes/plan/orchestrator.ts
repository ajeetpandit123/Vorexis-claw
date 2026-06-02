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


export async function runPlanMode(): Promise<void> {

    console.log(chalk.green("Starting plan mode..."));

    const goal = await text({
        message: "What would you like to achieve?",

    })

     if (isCancel(goal) || !goal.trim()) return;

     const plan = await  generatePlan(goal);



}