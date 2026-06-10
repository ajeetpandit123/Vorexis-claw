export type ModelProvider =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "google"
  | "ollama"
  | "lmstudio";

export type TaskCategory = "small" | "code" | "planning" | "analysis" | "general";

export interface ProviderInfo {
  id: ModelProvider;
  name: string;
  requiresApiKey: boolean;
  local: boolean;
  description: string;
}

export const PROVIDERS: ProviderInfo[] = [
  { id: "openrouter", name: "OpenRouter", requiresApiKey: true, local: false, description: "Multi-model cloud gateway" },
  { id: "openai", name: "OpenAI", requiresApiKey: true, local: false, description: "GPT models direct" },
  { id: "anthropic", name: "Anthropic", requiresApiKey: true, local: false, description: "Claude models direct" },
  { id: "google", name: "Google", requiresApiKey: true, local: false, description: "Gemini models direct" },
  { id: "ollama", name: "Ollama", requiresApiKey: false, local: true, description: "Local models via Ollama" },
  { id: "lmstudio", name: "LM Studio", requiresApiKey: false, local: true, description: "Local models via LM Studio" },
];

export interface ModelRouteOptions {
  prompt?: string;
  intent?: string;
  overrideProvider?: ModelProvider;
  overrideModel?: string;
}
