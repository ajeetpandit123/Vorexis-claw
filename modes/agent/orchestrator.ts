import chalk from 'chalk';
import { defaultAgentConfig } from './types.ts';
import { actionTracker } from './action-tracker.ts';
import { ToolExecutor } from './tool-executor.ts';
import { createAgentTools } from './agent-tools.ts';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { getAgentModel } from '../../AI/index.ts';
import { renderTerminalMarkdown } from '../../tui/terminal-md.ts';
import { runApprovalFlow } from './approval.ts';
import { showOnboardingError, resolveApiKey } from '../../config/config.ts';
import { printVoiceBanner, promptWithVoice } from '../voice/prompt-input.ts';

export async function runAgent(
  goal: string,
  approveFn?: () => Promise<boolean>
): Promise<string> {
  const config = defaultAgentConfig();
  const tracker = new actionTracker();
  const executor = new ToolExecutor(tracker, config);
  const tools = createAgentTools(executor);

  const agent = new ToolLoopAgent({
    model: getAgentModel(),
    stopWhen: stepCountIs(40),
    instructions: [
      `workspace root: ${config.codebasePath}`,
      `All mutation are staged untill approval`
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

export async function runAgentMode() {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    showOnboardingError();
    process.exit(0);
  }

  console.log(chalk.green("\n🤖 Agent Mode\n"));
  printVoiceBanner();

  while (true) {
    const goal = await promptWithVoice({
      message: "What would you like the agent to do?",
      placeholder: "Concrete task for this codebase...",
    });

    if (!goal) return;

    await runAgent(goal);
    console.log(chalk.dim("\nEnter another task, or press Ctrl+C to return to the menu.\n"));
  }
}
