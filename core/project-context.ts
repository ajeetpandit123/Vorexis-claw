import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export interface ProjectContext {
  name: string;
  framework: string;
  language: string;
  packageManager: string;
  gitBranch: string;
  gitStatus: string;
  rootPath: string;
}

function readJson(filePath: string): Record<string, unknown> | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function detectPackageManager(root: string): string {
  if (fs.existsSync(path.join(root, "bun.lock")) || fs.existsSync(path.join(root, "bun.lockb"))) {
    return "bun";
  }
  if (fs.existsSync(path.join(root, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.existsSync(path.join(root, "yarn.lock"))) return "yarn";
  if (fs.existsSync(path.join(root, "package-lock.json"))) return "npm";
  return "unknown";
}

function detectFramework(pkg: Record<string, unknown> | null): string {
  if (!pkg) return "unknown";

  const deps = {
    ...(pkg.dependencies as Record<string, string> | undefined),
    ...(pkg.devDependencies as Record<string, string> | undefined),
  };

  if (deps.next) return "Next.js";
  if (deps.react) return "React";
  if (deps.express) return "Express";
  if (deps["@nestjs/core"]) return "NestJS";
  if (deps.vite) return "Vite";
  if (deps.bun || deps["bun-types"]) return "Bun";
  if (deps.typescript) return "TypeScript";
  if (deps["vue"]) return "Vue";
  if (deps["svelte"]) return "Svelte";

  return "Node.js";
}

function detectLanguage(root: string, pkg: Record<string, unknown> | null): string {
  if (fs.existsSync(path.join(root, "tsconfig.json"))) return "TypeScript";
  const deps = pkg?.dependencies as Record<string, string> | undefined;
  const devDeps = pkg?.devDependencies as Record<string, string> | undefined;
  if (deps?.typescript || devDeps?.typescript) return "TypeScript";

  const files = fs.readdirSync(root);
  if (files.some((f) => f.endsWith(".ts") || f.endsWith(".tsx"))) return "TypeScript";
  if (files.some((f) => f.endsWith(".js") || f.endsWith(".jsx"))) return "JavaScript";
  if (files.some((f) => f.endsWith(".py"))) return "Python";
  if (files.some((f) => f.endsWith(".go"))) return "Go";
  if (files.some((f) => f.endsWith(".rs"))) return "Rust";

  return "unknown";
}

function detectGit(root: string): { branch: string; status: string } {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    const status = execSync("git status --porcelain", {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();

    if (!status) return { branch, status: "clean" };

    const lines = status.split("\n").filter(Boolean);
    return { branch, status: `${lines.length} change(s)` };
  } catch {
    return { branch: "n/a", status: "n/a" };
  }
}

export function detectProjectContext(root: string = process.cwd()): ProjectContext {
  const pkg = readJson(path.join(root, "package.json"));
  const git = detectGit(root);

  return {
    name: path.basename(root),
    framework: detectFramework(pkg),
    language: detectLanguage(root, pkg),
    packageManager: detectPackageManager(root),
    gitBranch: git.branch,
    gitStatus: git.status,
    rootPath: root,
  };
}

export function formatProjectContext(ctx: ProjectContext): string {
  return [
    `Project        : ${ctx.name}`,
    `Framework      : ${ctx.framework}`,
    `Language       : ${ctx.language}`,
    `Package Manager: ${ctx.packageManager}`,
    `Git Branch     : ${ctx.gitBranch}`,
    `Git Status     : ${ctx.gitStatus}`,
    `Root           : ${ctx.rootPath}`,
  ].join("\n");
}
