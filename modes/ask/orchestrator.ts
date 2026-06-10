import { ToolLoopAgent, stepCountIs, tool } from "ai"
import { z } from "zod"
import { getAgentModel } from "../../AI/ai.config.ts";
import { createPlatformTools } from "../../platform/tools.ts";
import { actionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import { createWebTools } from "../plan/webtool.ts";



function createAskTools(executor: ToolExecutor) {
    return {
        read_file: tool({
            description: "Read the content of a file. The path is relative to the root of the codebase.",
            inputSchema: z.object({
                path: z.string().describe("Relative path to the file to read, from the root of the codebase.")
            }),
            execute: async ({ path: p }) => executor.readFile(p)
        }),

        list_files: tool({
            description: "List files and directories under a path.",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional().default(false),
            }),
            execute: async ({ path: p, recursive }) =>
                executor.listFiles(p, recursive),
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
            description:
                "Summarize structure: file counts, size, extensions. Read-only.",
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
    }


}

export async function runAsk(Question: string): Promise<string> {
    const config = defaultAgentConfig();

    config.tools.allowFileCreation = true;
    config.tools.allowFileModification = false;
    config.tools.allowShellExecution = false;
    config.tools.allowFolderCreation = false;

    const tracker = new actionTracker();
    const executor = new ToolExecutor(tracker, config);
    const platformTools = await createPlatformTools();

    const tools = {
        ...createAskTools(executor),
        ...createWebTools(tracker),
        ...platformTools,
    };

    const agent = new ToolLoopAgent({
        model: getAgentModel({ prompt: Question, intent: "ASK" }),
        stopWhen: stepCountIs(20),
        tools,
        maxOutputTokens: 4000,
    });

    const result = await agent.generate({ prompt: Question.trim() });
    return result.text?.trim() || "No answer generated.";
}
