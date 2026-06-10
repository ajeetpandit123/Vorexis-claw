import chalk from 'chalk';
import { defaultAgentConfig } from './types.ts';
import { actionTracker } from './action-tracker.ts';
import { ToolExecutor } from './tool-executor.ts';
import { createAgentTools } from './agent-tools.ts';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { getAgentModel, getRoutedModelInfo } from '../../AI/index.ts';
import { renderTerminalMarkdown } from '../../tui/terminal-md.ts';
import { runApprovalFlow } from './approval.ts';
import { createPlatformTools, getPlatformToolSummary } from '../../platform/tools.ts';

export interface AgentRunOptions {
  intent?: string;
}

export async function runAgent(
  goal: string,
  approveFn?: () => Promise<boolean>,
  options: AgentRunOptions = {}
): Promise<string> {
  const config = defaultAgentConfig();
  const tracker = new actionTracker();
  const executor = new ToolExecutor(tracker, config);
  const platformTools = await createPlatformTools();
  const tools = { ...createAgentTools(executor), ...platformTools };

  const route = getRoutedModelInfo({ prompt: goal, intent: options.intent ?? "AGENT" });
  console.log(chalk.dim(`Model: ${route.model} (${route.reason})`));

  const agent = new ToolLoopAgent({
    model: getAgentModel({ prompt: goal, intent: options.intent ?? "AGENT" }),
    stopWhen: stepCountIs(40),
    instructions: [
      `workspace root: ${config.codebasePath}`,
      `Platform tools: ${getPlatformToolSummary()}`,
      `Workflow: understand goal → plan approach → select tools → execute → verify → report`,
      `Use GitHub tools for PRs, issues, branches when the task involves remote repository workflows.`,
      `Use MCP tools when external systems (database, browser, docker) are required.`,
      `All file mutations are staged until user approval.`,
    ].join("\n"),
    tools,
    maxOutputTokens: 4000,
  });

  const result = await agent.generate({
    prompt: goal.trim(),
    onStepFinish: ({ toolCalls }) => {
      for (const tc of toolCalls) {
        const preview = JSON.stringify(tc.input).slice(0, 160);
        console.log(
          chalk.green("  ✓"),
          chalk.bold(String(tc.toolName)),
          chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
        );
      }
    },
  });

  const textOutput = result.text?.trim() || "No agent response generated.";
  console.log(renderTerminalMarkdown(textOutput));

  let ok = false;
  if (approveFn) {
    ok = await approveFn();
  } else {
    ok = await runApprovalFlow(tracker);
  }

  if (!ok) {
    executor.clearStaging();
    return textOutput + "\nChanges were discarded.";
  }

  const { errors } = executor.applyApprovedFromTracker();
  let statusStr = "";
  if (errors.length) {
    statusStr = "\nSome operations reported errors:\n";
    for (const e of errors) statusStr += `  • ${e}\n`;
    console.log(chalk.red(statusStr));
  } else {
    statusStr = "\n✓ Applied.\n";
    console.log(chalk.green(statusStr));
  }

  executor.clearStaging();
  return textOutput + statusStr;
}
