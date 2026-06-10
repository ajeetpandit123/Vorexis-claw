export type Intent = "ASK" | "PLAN" | "AGENT" | "HELP";

const PLAN_PATTERNS =
  /\b(plan|roadmap|architecture plan|strategy|outline|milestones?|phases?|implementation plan|project plan|step[- ]by[- ]step plan|deployment plan|feature plan)\b/i;

const ASK_PATTERNS =
  /^(what|where|why|how|who|when|which|explain|describe|tell me|show me|list|find|is there|are there|can you explain|could you explain)\b/i;

const READ_PATTERNS =
  /\b(read|inside|contents of|what's in|what is in|look at|open|summarize)\b/i;

const AGENT_PATTERNS =
  /\b(build|create|implement|fix|refactor|add|generate|write|develop|deploy|install|update|modify|edit|delete|remove|migrate|setup|configure|scaffold|integrate|convert|rename|move)\b/i;

export function detectIntent(prompt: string): Intent {
  const trimmed = prompt.trim();
  const lower = trimmed.toLowerCase();

  if (!trimmed) return "HELP";
  if (lower === "help" || lower === "--help" || lower === "/help") return "HELP";

  if (PLAN_PATTERNS.test(lower)) return "PLAN";
  if (trimmed.endsWith("?") || ASK_PATTERNS.test(lower) || READ_PATTERNS.test(lower)) {
    return "ASK";
  }
  if (AGENT_PATTERNS.test(lower)) return "AGENT";

  return trimmed.endsWith("?") ? "ASK" : "AGENT";
}

export function intentLabel(intent: Intent): string {
  switch (intent) {
    case "ASK":
      return "Ask";
    case "PLAN":
      return "Plan";
    case "AGENT":
      return "Agent";
    case "HELP":
      return "Help";
  }
}
