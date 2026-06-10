import chalk from "chalk";
import { password, isCancel } from "@clack/prompts";

import { loadConfig, saveConfig } from "../../config/config.ts";
import { getAuthenticatedUser, hasGitHubAuth, parseRepoFromRemote } from "./service.ts";

export async function runGitHubLogin(): Promise<void> {
  const token = await password({
    message: "Enter your GitHub Personal Access Token:",
    validate: (v) => (!v?.trim() ? "Token cannot be empty." : undefined),
  });

  if (isCancel(token)) {
    console.log(chalk.yellow("GitHub login cancelled."));
    return;
  }

  saveConfig({ ...loadConfig(), githubToken: token.trim() });

  try {
    const user = await getAuthenticatedUser();
    console.log(chalk.green(`\n✓ GitHub authenticated as ${user.login}\n`));
  } catch {
    console.log(chalk.green("\n✓ GitHub token saved.\n"));
  }
}

export function runGitHubLogout(): void {
  const config = loadConfig();
  delete config.githubToken;
  saveConfig(config);
  console.log(chalk.green("GitHub credentials removed."));
}

export async function runGitHubStatus(): Promise<void> {
  console.log(chalk.hex("#5b4d9e").bold("\n⚡ GitHub Status\n"));

  if (!hasGitHubAuth()) {
    console.log(chalk.red("Not authenticated. Run: vorexis-claw github login\n"));
    return;
  }

  try {
    const user = await getAuthenticatedUser();
    console.log(`User       : ${chalk.white(user.login)}`);
    console.log(`Repos      : ${chalk.white(String(user.public_repos))}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`Auth error : ${msg}`));
    return;
  }

  const remote = parseRepoFromRemote();
  if (remote) {
    console.log(`Remote Repo: ${chalk.white(`${remote.owner}/${remote.repo}`)}`);
  } else {
    console.log(chalk.dim("Remote Repo: not detected (not a GitHub git repo)"));
  }
  console.log();
}
