import {
  Output,
  extractJsonMiddleware,
  generateText,
  stepCountIs,
  tool,
  wrapLanguageModel,
} from "ai";

import { z } from "zod";
import chalk from "chalk";
import { getAgentModel } from "../../AI/ai.config.ts";
import { actionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import type { PlanStep } from "./types.ts";
import { createWebTools } from "./webtool.ts";

function createPlanSchema(minSteps: number) {
  return z.object({
    researchSummary: z.string().optional(),
    goal: z.string(),
    steps: z
      .array(
        z.object({
          title: z.string(),
          description: z.string(),
          hints: z.array(z.string()).optional(),
          complexity: z.enum(["low", "medium", "high"]).optional(),
        })
      )
      .min(minSteps, `At least ${minSteps} steps are required`)
      .max(15, "No more than 15 steps are allowed"),
  });
}

function inferMinimumSteps(goal: string): number {
  const implementationPattern =
    /\b(add|build|create|implement|integrate|connect|wire|setup|set up|telegram|bot|webhook|api|auth|database|payment|deploy)\b/i;

  return implementationPattern.test(goal) ? 10 : 4;
}

function readOnlyTools(executor: ToolExecutor) {
  return {
    read_file: tool({
      description:
        "Read the content of a file. The path is relative to the root of the codebase.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("Relative path to the file to read, from the root of the codebase."),
      }),
      execute: async ({ path: p }) => executor.readFile(p),
    }),

    list_files: tool({
      description: "List files and directories under a path.",
      inputSchema: z.object({
        path: z.string(),
        recursive: z.boolean().optional().default(false),
      }),
      execute: async ({ path: p, recursive }) => executor.listFiles(p, recursive),
    }),

    search_files: tool({
      description:
        'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
      inputSchema: z.object({
        root: z.string().describe("Directory to search, relative to root"),
        pattern: z
          .string()
          .describe("Glob-like pattern using * and ** (forward slashes)"),
        content_contains: z.string().optional(),
      }),
      execute: async ({ root, pattern, content_contains }) =>
        executor.searchFiles(root, pattern, content_contains),
    }),

    analyze_codebase: tool({
      description: "Summarize structure: file counts, size, extensions. Read-only.",
      inputSchema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path: p }) => executor.analyzeCodebase(p),
    }),

    list_skills: tool({
      description:
        "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
      inputSchema: z.object({}),
      execute: async () => executor.listSkills(),
    }),

    read_skill: tool({
      description:
        "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path: p }) => executor.readSkill(p),
    }),
  };
}

const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean, minSteps: number) =>
  [
    "You are a Plan-Mode planner. You DO NOT modify files.",
    `Workspace: ${codebase}`,
    "Use read-only tools for codebase/skills research.",
    hasWeb
      ? "Web tools are available (web_search/web_crawl/fetch_url). Use only when needed."
      : "Web tools are unavailable (no FIRECRAWL_API_KEY).",
    "Output must match the provided JSON schema.",
    `Produce at least ${minSteps} steps and no more than 15 steps.`,
    "For integration or implementation goals, create a real execution plan with 10-12 concrete steps.",
    "Do not stop at discovery. Include implementation, configuration, error handling, documentation, and verification steps when relevant.",
    "Each step must be actionable enough to execute independently after selection.",
  ].join("\n");

export async function generatePlan(goal: string) {
  const config = defaultAgentConfig();
  const tracker = new actionTracker();
  const executor = new ToolExecutor(tracker, config);

  const hasWeb = !!process.env.FIRECRAWL_API_KEY;
  const minSteps = inferMinimumSteps(goal);
  const PlanSchema = createPlanSchema(minSteps);
  const model = wrapLanguageModel({
    model: getAgentModel(),
    middleware: extractJsonMiddleware(),
  });

  const tools = {
    ...readOnlyTools(executor),
    ...(hasWeb ? createWebTools(tracker) : {}),
  };

  console.log(chalk.cyan("\nResearching & drafting a plan...\n"));

  const result = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(20),
    system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb, minSteps),
    prompt: `User goal: \n${goal}`,
    output: Output.object({ schema: PlanSchema }),
  });

  const validated = PlanSchema.parse(result.output);

  const steps: PlanStep[] = validated.steps.map((s, i) => ({
    id: `step-${i + 1}`,
    title: s.title,
    description: s.description,
    hints: s.hints,
    complexity: s.complexity,
  }));

  return { goal, researchSummary: validated.researchSummary, steps };
}
