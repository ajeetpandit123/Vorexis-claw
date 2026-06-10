import type { TaskCategory } from "./types.ts";

const SMALL_PATTERNS = /\b(what|where|list|show|status|hello|hi|thanks)\b/i;
const CODE_PATTERNS = /\b(build|implement|fix|refactor|generate|write|code|function|class|api|endpoint|bug)\b/i;
const PLAN_PATTERNS = /\b(plan|roadmap|architecture|strategy|design|milestones?|phases?|outline)\b/i;
const ANALYSIS_PATTERNS = /\b(analyze|review|explain|understand|compare|audit|inspect|schema|structure)\b/i;

export function classifyTask(prompt: string, intent?: string): TaskCategory {
  const lower = prompt.toLowerCase();

  if (intent === "PLAN" || PLAN_PATTERNS.test(lower)) return "planning";
  if (intent === "ASK" && ANALYSIS_PATTERNS.test(lower)) return "analysis";
  if (intent === "AGENT" || CODE_PATTERNS.test(lower)) return "code";
  if (SMALL_PATTERNS.test(lower) && prompt.length < 80) return "small";
  if (ANALYSIS_PATTERNS.test(lower)) return "analysis";

  return "general";
}

export interface RoutedModel {
  provider: string;
  model: string;
  reason: string;
}

export function routeModel(
  task: TaskCategory,
  configuredProvider: string,
  configuredModel?: string
): RoutedModel {
  if (configuredModel) {
    return {
      provider: configuredProvider,
      model: configuredModel,
      reason: "Manual model selection from config",
    };
  }

  if (configuredProvider === "ollama") {
    const models: Record<TaskCategory, string> = {
      small: "qwen2.5:3b",
      code: "qwen2.5-coder:7b",
      planning: "qwen2.5:7b",
      analysis: "qwen2.5:7b",
      general: "qwen2.5:7b",
    };
    return { provider: "ollama", model: models[task], reason: `Local routing for ${task} task` };
  }

  if (configuredProvider === "lmstudio") {
    return { provider: "lmstudio", model: "local-model", reason: `LM Studio for ${task} task` };
  }

  const openrouterModels: Record<TaskCategory, string> = {
    small: "google/gemini-2.5-flash",
    code: "deepseek/deepseek-chat-v3-0324",
    planning: "anthropic/claude-sonnet-4",
    analysis: "google/gemini-2.5-pro",
    general: "google/gemini-2.5-flash",
  };

  const directModels: Record<string, Record<TaskCategory, string>> = {
    openai: {
      small: "gpt-4o-mini",
      code: "gpt-4o",
      planning: "gpt-4o",
      analysis: "gpt-4o",
      general: "gpt-4o-mini",
    },
    anthropic: {
      small: "claude-sonnet-4-20250514",
      code: "claude-sonnet-4-20250514",
      planning: "claude-sonnet-4-20250514",
      analysis: "claude-sonnet-4-20250514",
      general: "claude-sonnet-4-20250514",
    },
    google: {
      small: "gemini-2.5-flash",
      code: "gemini-2.5-pro",
      planning: "gemini-2.5-pro",
      analysis: "gemini-2.5-pro",
      general: "gemini-2.5-flash",
    },
  };

  if (configuredProvider === "openrouter") {
    return {
      provider: "openrouter",
      model: openrouterModels[task],
      reason: `Auto-routed ${task} task via OpenRouter`,
    };
  }

  const direct = directModels[configuredProvider];
  if (direct) {
    return {
      provider: configuredProvider,
      model: direct[task],
      reason: `Auto-routed ${task} task via ${configuredProvider}`,
    };
  }

  return {
    provider: configuredProvider,
    model: openrouterModels.general,
    reason: "Fallback model",
  };
}
