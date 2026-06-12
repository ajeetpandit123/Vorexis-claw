import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

import { loadConfig, resolveApiKey } from "../../config/config.ts";
import { classifyTask, routeModel } from "./model-router.ts";
import type { ModelProvider, ModelRouteOptions } from "./types.ts";

export function getModelProvider(): ModelProvider {
  const config = loadConfig();
  return (config.modelProvider ?? config.provider ?? "openrouter") as ModelProvider;
}

export function resolveProviderApiKey(provider: ModelProvider): string | undefined {
  const config = loadConfig();
  switch (provider) {
    case "openrouter":
      return resolveApiKey();
    case "openai":
      return config.openaiApiKey ?? process.env.OPENAI_API_KEY;
    case "anthropic":
      return config.anthropicApiKey ?? process.env.ANTHROPIC_API_KEY;
    case "google":
      return config.googleApiKey ?? process.env.GOOGLE_API_KEY;
    case "ollama":
    case "lmstudio":
      return "local";
    default:
      return resolveApiKey();
  }
}

export function hasProviderCredentials(provider?: ModelProvider): boolean {
  const p = provider ?? getModelProvider();
  if (p === "ollama" || p === "lmstudio") return true;
  const key = resolveProviderApiKey(p);
  return !!key && key !== "local";
}

export function getAgentModel(options: ModelRouteOptions = {}) {
  const config = loadConfig();
  const provider = (options.overrideProvider ?? getModelProvider()) as ModelProvider;
  const task = classifyTask(options.prompt ?? "", options.intent);
  const routed = routeModel(task, provider, options.overrideModel ?? config.modelName);

  if (provider !== "ollama" && provider !== "lmstudio") {
    const apiKey = resolveProviderApiKey(provider);
    if (!apiKey) {
      throw new Error(`No API key configured for provider: ${provider}. Run: vorexis-claw provider set ${provider}`);
    }
  }

  const modelId = routed.model;

  switch (provider) {
    case "openrouter": {
      const or = createOpenRouter({ apiKey: resolveProviderApiKey("openrouter")! });
      return or(modelId);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey: resolveProviderApiKey("openai")! });
      return openai(modelId);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: resolveProviderApiKey("anthropic")! });
      return anthropic(modelId);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey: resolveProviderApiKey("google")! });
      return google(modelId);
    }
    case "ollama": {
      const baseURL = config.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434/v1";
      const ollama = createOpenAI({ apiKey: "ollama", baseURL });
      return ollama(modelId);
    }
    case "lmstudio": {
      const baseURL = config.lmstudioBaseUrl ?? process.env.LMSTUDIO_BASE_URL ?? "http://127.0.0.1:1234/v1";
      const lm = createOpenAI({ apiKey: "lmstudio", baseURL });
      return lm(modelId);
    }
    default: {
      const or = createOpenRouter({ apiKey: resolveApiKey()! });
      return or(modelId);
    }
  }
}

export function getRoutedModelInfo(options: ModelRouteOptions = {}) {
  const provider = getModelProvider();
  const task = classifyTask(options.prompt ?? "", options.intent);
  const routed = routeModel(task, provider, loadConfig().modelName);
  return { ...routed, task };
}

export async function listOllamaModels(): Promise<string[]> {
  const config = loadConfig();
  const base = (config.ollamaBaseUrl ?? "http://127.0.0.1:11434/v1").replace(/\/v1$/, "");
  try {
    const res = await fetch(`${base}/api/tags`);
    if (!res.ok) return [];
    const data = (await res.json()) as { models?: Array<{ name: string }> };
    return data.models?.map((m) => m.name) ?? [];
  } catch {
    return [];
  }
}

export async function checkLocalProviderHealth(provider: ModelProvider): Promise<boolean> {
  if (provider === "ollama") {
    const models = await listOllamaModels();
    return models.length > 0;
  }
  if (provider === "lmstudio") {
    const config = loadConfig();
    const baseURL = config.lmstudioBaseUrl ?? "http://127.0.0.1:1234/v1";
    try {
      const res = await fetch(`${baseURL}/models`);
      return res.ok;
    } catch {
      return false;
    }
  }
  return false;
}
