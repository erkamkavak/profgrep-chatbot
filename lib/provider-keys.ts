// Provider API keys management - stored in localStorage on client side
// Keys are sent with each request to the chat API

export type ProviderId = "openai" | "anthropic" | "google" | "xai" | "openrouter";

export interface ProviderConfig {
  id: ProviderId;
  name: string;
  description: string;
  keyPlaceholder: string;
  docsUrl: string;
}

export const PROVIDER_CONFIGS: Record<ProviderId, ProviderConfig> = {
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "Access multiple models through OpenRouter (free models available)",
    keyPlaceholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/keys",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano",
    keyPlaceholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude Opus 4, Claude Sonnet 4, Claude Haiku 4",
    keyPlaceholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  google: {
    id: "google",
    name: "Google",
    description: "Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.0 Flash",
    keyPlaceholder: "AIza...",
    docsUrl: "https://aistudio.google.com/app/apikey",
  },
  xai: {
    id: "xai",
    name: "xAI",
    description: "Grok 3 Beta, Grok 3 Mini Beta",
    keyPlaceholder: "xai-...",
    docsUrl: "https://console.x.ai/",
  },
};

const STORAGE_KEY = "sparka-provider-keys";

export interface ProviderKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
  xai?: string;
  openrouter?: string;
}

// Client-side functions
export function getProviderKeys(): ProviderKeys {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function setProviderKey(provider: ProviderId, key: string): void {
  if (typeof window === "undefined") return;
  const keys = getProviderKeys();
  if (key) {
    keys[provider] = key;
  } else {
    delete keys[provider];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function removeProviderKey(provider: ProviderId): void {
  if (typeof window === "undefined") return;
  const keys = getProviderKeys();
  delete keys[provider];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export function hasProviderKey(provider: ProviderId): boolean {
  const keys = getProviderKeys();
  return !!keys[provider];
}

export function getActiveProviders(): ProviderId[] {
  const keys = getProviderKeys();
  const active: ProviderId[] = ["openrouter"]; // OpenRouter always active (free models)
  for (const provider of Object.keys(keys) as ProviderId[]) {
    if (keys[provider] && !active.includes(provider)) {
      active.push(provider);
    }
  }
  return active;
}
