import { tool } from "ai";
import { z } from "zod";
import {
  searchRepositories,
  getRepository,
  listPullRequests,
  getPullRequest,
  getPullRequestFiles,
  createPullRequest,
  listIssues,
  getIssue,
  createIssueComment,
  createBranch,
  listBranches,
  parseRepoFromRemote,
  hasGitHubAuth,
} from "./service.ts";

function requireAuth(): void {
  if (!hasGitHubAuth()) {
    throw new Error("GitHub not authenticated. Run: vorexis-claw github login");
  }
}

export function createGitHubTools() {
  return {
    github_search_repos: tool({
      description: "Search GitHub repositories by query.",
      inputSchema: z.object({ query: z.string(), limit: z.number().optional().default(5) }),
      execute: async ({ query, limit }) => {
        requireAuth();
        const items = await searchRepositories(query, limit);
        return JSON.stringify(items, null, 2);
      },
    }),

    github_get_repo: tool({
      description: "Get metadata for a GitHub repository (owner/repo).",
      inputSchema: z.object({ owner: z.string(), repo: z.string() }),
      execute: async ({ owner, repo }) => {
        requireAuth();
        return JSON.stringify(await getRepository(owner, repo), null, 2);
      },
    }),

    github_list_prs: tool({
      description: "List pull requests for a repository. Defaults to current git remote if owner/repo omitted.",
      inputSchema: z.object({
        owner: z.string().optional(),
        repo: z.string().optional(),
        state: z.enum(["open", "closed", "all"]).optional().default("open"),
      }),
      execute: async ({ owner, repo, state }) => {
        requireAuth();
        const remote = !owner || !repo ? parseRepoFromRemote() : null;
        const o = owner ?? remote?.owner;
        const r = repo ?? remote?.repo;
        if (!o || !r) throw new Error("Provide owner/repo or run inside a GitHub git repo.");
        return JSON.stringify(await listPullRequests(o, r, state), null, 2);
      },
    }),

    github_get_pr: tool({
      description: "Get a pull request and its changed files.",
      inputSchema: z.object({
        owner: z.string().optional(),
        repo: z.string().optional(),
        number: z.number(),
      }),
      execute: async ({ owner, repo, number }) => {
        requireAuth();
        const remote = !owner || !repo ? parseRepoFromRemote() : null;
        const o = owner ?? remote?.owner;
        const r = repo ?? remote?.repo;
        if (!o || !r) throw new Error("Provide owner/repo or run inside a GitHub git repo.");
        const pr = await getPullRequest(o, r, number);
        const files = await getPullRequestFiles(o, r, number);
        return JSON.stringify({ pr, files }, null, 2);
      },
    }),

    github_create_pr: tool({
      description: "Create a pull request on GitHub.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        title: z.string(),
        body: z.string(),
        head: z.string(),
        base: z.string().default("main"),
      }),
      execute: async (input) => {
        requireAuth();
        const pr = await createPullRequest(input.owner, input.repo, input.title, input.body, input.head, input.base);
        return JSON.stringify(pr, null, 2);
      },
    }),

    github_list_issues: tool({
      description: "List issues for a repository.",
      inputSchema: z.object({
        owner: z.string().optional(),
        repo: z.string().optional(),
        state: z.enum(["open", "closed", "all"]).optional().default("open"),
      }),
      execute: async ({ owner, repo, state }) => {
        requireAuth();
        const remote = !owner || !repo ? parseRepoFromRemote() : null;
        const o = owner ?? remote?.owner;
        const r = repo ?? remote?.repo;
        if (!o || !r) throw new Error("Provide owner/repo or run inside a GitHub git repo.");
        return JSON.stringify(await listIssues(o, r, state), null, 2);
      },
    }),

    github_get_issue: tool({
      description: "Get a GitHub issue by number.",
      inputSchema: z.object({
        owner: z.string().optional(),
        repo: z.string().optional(),
        number: z.number(),
      }),
      execute: async ({ owner, repo, number }) => {
        requireAuth();
        const remote = !owner || !repo ? parseRepoFromRemote() : null;
        const o = owner ?? remote?.owner;
        const r = repo ?? remote?.repo;
        if (!o || !r) throw new Error("Provide owner/repo or run inside a GitHub git repo.");
        return JSON.stringify(await getIssue(o, r, number), null, 2);
      },
    }),

    github_comment_issue: tool({
      description: "Post a comment on a GitHub issue or PR.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        number: z.number(),
        body: z.string(),
      }),
      execute: async ({ owner, repo, number, body }) => {
        requireAuth();
        return JSON.stringify(await createIssueComment(owner, repo, number, body), null, 2);
      },
    }),

    github_create_branch: tool({
      description: "Create a new branch on GitHub from a base branch.",
      inputSchema: z.object({
        owner: z.string(),
        repo: z.string(),
        branch: z.string(),
        from: z.string().default("main"),
      }),
      execute: async ({ owner, repo, branch, from }) => {
        requireAuth();
        return JSON.stringify(await createBranch(owner, repo, branch, from), null, 2);
      },
    }),

    github_list_branches: tool({
      description: "List branches in a GitHub repository.",
      inputSchema: z.object({ owner: z.string().optional(), repo: z.string().optional() }),
      execute: async ({ owner, repo }) => {
        requireAuth();
        const remote = !owner || !repo ? parseRepoFromRemote() : null;
        const o = owner ?? remote?.owner;
        const r = repo ?? remote?.repo;
        if (!o || !r) throw new Error("Provide owner/repo or run inside a GitHub git repo.");
        return JSON.stringify(await listBranches(o, r), null, 2);
      },
    }),
  };
}
