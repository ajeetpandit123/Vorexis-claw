import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { loadConfig, showOnboardingError, resolveApiKey } from "../config/config.ts";

export function getAgentModel() {
  const apiKey = resolveApiKey();
  if (!apiKey) {
    showOnboardingError();
    process.exit(0);
  }

  const provider = createOpenRouter({
    apiKey,
  });

  const modelId = process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.5-flash";

  return provider(modelId);
}