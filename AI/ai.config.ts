import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { loadConfig } from "../config/config.ts";

export function getAgentModel() {
  const apiKey = process.env.OPENROUTER_API_KEY ?? loadConfig().openrouterApiKey;
  if (!apiKey) {
    console.log("No OpenRouter API key configured.\n\nRun:\nvorexis-claw login");
    process.exit(0);
  }

  const provider = createOpenRouter({
    apiKey,
  });

  const modelId = process.env.OPENROUTER_DEFAULT_MODEL || "google/gemini-2.5-flash";

  return provider(modelId);
}