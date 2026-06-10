import { execSync } from "node:child_process";
import { loadConfig } from "../../config/config.ts";

const GITHUB_API = "https://api.github.com";

export function resolveGitHubToken(): string | undefined {
  const config = loadConfig();
  return config.githubToken ?? process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
}

export function hasGitHubAuth(): boolean {
  return !!resolveGitHubToken();
}

async function githubFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = resolveGitHubToken();
  if (!token) {
    throw new Error("GitHub not authenticated. Run: vorexis-claw github login");
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${GITHUB_API}${path}`, { ...options, headers });
}

async function githubJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await githubFetch(path, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json() as Promise<T>;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  public_repos: number;
}

export async function getAuthenticatedUser(): Promise<GitHubUser> {
  return githubJson<GitHubUser>("/user");
}

export async function searchRepositories(query: string, limit = 10) {
  const data = await githubJson<{ items: unknown[] }>(
    `/search/repositories?q=${encodeURIComponent(query)}&per_page=${limit}`
  );
  return data.items;
}

export async function getRepository(owner: string, repo: string) {
  return githubJson(`/repos/${owner}/${repo}`);
}

export async function listPullRequests(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
  return githubJson(`/repos/${owner}/${repo}/pulls?state=${state}&per_page=20`);
}

export async function getPullRequest(owner: string, repo: string, number: number) {
  return githubJson(`/repos/${owner}/${repo}/pulls/${number}`);
}

export async function getPullRequestFiles(owner: string, repo: string, number: number) {
  return githubJson(`/repos/${owner}/${repo}/pulls/${number}/files`);
}

export async function createPullRequest(
  owner: string,
  repo: string,
  title: string,
  body: string,
  head: string,
  base: string
) {
  return githubJson(`/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    body: JSON.stringify({ title, body, head, base }),
  });
}

export async function listIssues(owner: string, repo: string, state: "open" | "closed" | "all" = "open") {
  return githubJson(`/repos/${owner}/${repo}/issues?state=${state}&per_page=20`);
}

export async function getIssue(owner: string, repo: string, number: number) {
  return githubJson(`/repos/${owner}/${repo}/issues/${number}`);
}

export async function createIssueComment(owner: string, repo: string, number: number, body: string) {
  return githubJson(`/repos/${owner}/${repo}/issues/${number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function createBranch(owner: string, repo: string, branchName: string, fromRef = "main") {
  const ref = await githubJson<{ object: { sha: string } }>(`/repos/${owner}/${repo}/git/ref/heads/${fromRef}`);
  return githubJson(`/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: ref.object.sha }),
  });
}

export async function listBranches(owner: string, repo: string) {
  return githubJson(`/repos/${owner}/${repo}/branches?per_page=30`);
}

export function parseRepoFromRemote(): { owner: string; repo: string } | null {
  try {
    const url = execSync("git remote get-url origin", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    const match = url.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  } catch {
    return null;
  }
}
