import chalk from 'chalk';
import { text, isCancel } from '@clack/prompts';
import { defaultAgentConfig } from './types.ts';
import { actionTracker } from './action-tracker.ts';
import { ToolExecutor } from './tool-executor.ts';
import { createAgentTools } from './agent-tools.ts';
import { stepCountIs, ToolLoopAgent } from 'ai';
import { getAgentModel } from '../../AI/index.ts';
import { renderTerminalMarkdown } from '../../tui/terminal-md.ts';
import { runApprovalFlow } from './approval.ts';
import { loadConfig } from '../../config/config.ts';



export async function runAgentMode() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? loadConfig().openrouterApiKey;
  if (!apiKey) {
    console.log("No OpenRouter API key configured.\n\nRun:\nvorexis-claw login");
    process.exit(0);
  }

  console.log(chalk.green("Starting agent mode..."));


  const goal = await text({
    message: "What  would you like the agent to do?",
    placeholder: "Concrete task for this code base...",

  });

  if (isCancel(goal) || !goal.trim()) return;


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

  if(result.text?.trim()) console.log(renderTerminalMarkdown(result.text));

   const ok = await runApprovalFlow(tracker);
   if(!ok) return executor.clearStaging();

   const { errors } = executor.applyApprovedFromTracker();

  if (errors.length) {
    console.log(chalk.red("\nSome operations reported errors:\n"));
    for (const e of errors) console.log(chalk.red(`  • ${e}`));
  }
  else{
   console.log(chalk.green('\n✓ Applied.\n'));
  }

  executor.clearStaging()

}
