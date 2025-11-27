import {
  type ImageModelData,
  imageModelsData,
} from "@/lib/models/image-models";
import type { ImageModelId } from "../models/image-model-id";
import type { ProviderId } from "../provider-keys";

export type ImageModelDefinition = ImageModelData & {
  features?: never; // deprecated: use ModelExtra in base defs if needed later
};

// Provider type for models
export type ModelProviderId = ProviderId;

// OpenRouter free models (always available)
const OPENROUTER_FREE_MODELS = {
  "openrouter:x-ai/grok-4.1-fast:free": {
    name: "Grok 4.1 Fast (Free)",
    owned_by: "openrouter",
    apiModelId: "x-ai/grok-4.1-fast:free",
  },
  "openrouter:z-ai/glm-4.5-air:free": {
    name: "GLM 4.5 Air (Free)",
    owned_by: "openrouter",
    apiModelId: "z-ai/glm-4.5-air:free",
  },
  "openrouter:moonshotai/kimi-k2:free": {
    name: "Kimi K2 (Free)",
    owned_by: "openrouter",
    apiModelId: "moonshotai/kimi-k2:free",
  },
  "openrouter:meituan/longcat-flash-chat:free": {
    name: "Longcat Flash Chat (Free)",
    owned_by: "openrouter",
    apiModelId: "meituan/longcat-flash-chat:free",
  },
} as const;

// OpenAI models (requires API key)
const OPENAI_MODELS = {
  "openai:gpt-4.1": {
    name: "GPT-4.1",
    owned_by: "openai",
    apiModelId: "gpt-4.1",
  },
  "openai:gpt-4.1-mini": {
    name: "GPT-4.1 Mini",
    owned_by: "openai",
    apiModelId: "gpt-4.1-mini",
  },
  "openai:gpt-4.1-nano": {
    name: "GPT-4.1 Nano",
    owned_by: "openai",
    apiModelId: "gpt-4.1-nano",
  },
} as const;

// Anthropic models (requires API key)
const ANTHROPIC_MODELS = {
  "anthropic:claude-opus-4-20250514": {
    name: "Claude Opus 4",
    owned_by: "anthropic",
    apiModelId: "claude-opus-4-20250514",
  },
  "anthropic:claude-sonnet-4-20250514": {
    name: "Claude Sonnet 4",
    owned_by: "anthropic",
    apiModelId: "claude-sonnet-4-20250514",
  },
  "anthropic:claude-haiku-4-20250514": {
    name: "Claude Haiku 4",
    owned_by: "anthropic",
    apiModelId: "claude-haiku-4-20250514",
  },
} as const;

// Google models (requires API key)
const GOOGLE_MODELS = {
  "google:gemini-2.5-pro-preview-06-05": {
    name: "Gemini 2.5 Pro",
    owned_by: "google",
    apiModelId: "gemini-2.5-pro-preview-06-05",
  },
  "google:gemini-2.5-flash-preview-05-20": {
    name: "Gemini 2.5 Flash",
    owned_by: "google",
    apiModelId: "gemini-2.5-flash-preview-05-20",
  },
  "google:gemini-2.0-flash": {
    name: "Gemini 2.0 Flash",
    owned_by: "google",
    apiModelId: "gemini-2.0-flash",
  },
} as const;

// xAI models (requires API key)
const XAI_MODELS = {
  "xai:grok-3-beta": {
    name: "Grok 3 Beta",
    owned_by: "xai",
    apiModelId: "grok-3-beta",
  },
  "xai:grok-3-mini-beta": {
    name: "Grok 3 Mini Beta",
    owned_by: "xai",
    apiModelId: "grok-3-mini-beta",
  },
} as const;

// Combined models object
const ALL_MODELS = {
  ...OPENROUTER_FREE_MODELS,
  ...OPENAI_MODELS,
  ...ANTHROPIC_MODELS,
  ...GOOGLE_MODELS,
  ...XAI_MODELS,
} as const;

export type ModelId = keyof typeof ALL_MODELS;
export type AppModelId = ModelId;

export type AppModelDefinition = {
  id: AppModelId;
  apiModelId: string;
  name: string;
  owned_by: ModelProviderId;
  type: "language";
  input?: { tools?: boolean; image?: boolean; pdf?: boolean; audio?: boolean };
  output?: { text?: boolean; image?: boolean; audio?: boolean };
  reasoning?: boolean;
  disabled?: boolean;
  fixedTemperature?: number;
  toolCall?: boolean;
};

const PROVIDER_ORDER: ModelProviderId[] = ["openrouter", "openai", "google", "anthropic", "xai"];

export const allAppModels: AppModelDefinition[] = (
  Object.entries(ALL_MODELS) as Array<[ModelId, (typeof ALL_MODELS)[ModelId]]>
).map(([id, config]) => ({
  id,
  apiModelId: config.apiModelId,
  name: config.name,
  owned_by: config.owned_by as ModelProviderId,
  type: "language" as const,
  input: { tools: true },
  output: { text: true as const },
  reasoning: "reasoning" in config ? Boolean(config.reasoning) : false,
}));

// Get models that require a specific provider's API key
export function getModelsForProvider(providerId: ModelProviderId): AppModelDefinition[] {
  return allAppModels.filter((model) => model.owned_by === providerId);
}

// Get provider ID from model ID
export function getProviderFromModelId(modelId: AppModelId): ModelProviderId {
  const model = allAppModels.find((m) => m.id === modelId);
  return model?.owned_by ?? "openrouter";
}

export const chatModels = allAppModels
  .filter((model) => model.output?.text === true)
  .sort((a, b) => {
    const aProviderIndex = PROVIDER_ORDER.indexOf(a.owned_by);
    const bProviderIndex = PROVIDER_ORDER.indexOf(b.owned_by);

    const aIndex =
      aProviderIndex === -1 ? PROVIDER_ORDER.length : aProviderIndex;
    const bIndex =
      bProviderIndex === -1 ? PROVIDER_ORDER.length : bProviderIndex;

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return 0;
  });

// Memoized dictionary of models by ID for efficient lookups
const _modelsByIdCache = new Map<string, AppModelDefinition>();

function getModelsByIdDict(): Map<string, AppModelDefinition> {
  if (_modelsByIdCache.size === 0) {
    for (const model of allAppModels) {
      _modelsByIdCache.set(model.id, model);
    }
  }
  return _modelsByIdCache;
}

export function getAppModelDefinition(modelId: AppModelId): AppModelDefinition {
  const modelsByIdDict = getModelsByIdDict();

  const model = modelsByIdDict.get(modelId);
  if (!model) {
    // Fallback for legacy / unknown model IDs (e.g. from older chats or DB rows)
    const fallback = modelsByIdDict.get(DEFAULT_CHAT_MODEL);
    if (!fallback) {
      throw new Error(`Model ${modelId} not found and no DEFAULT_CHAT_MODEL available`);
    }
    return fallback;
  }
  return model;
}

const _imageModelsByIdCache = new Map<string, ImageModelDefinition>();

function getImageModelsByIdDict(): Map<string, ImageModelDefinition> {
  if (_imageModelsByIdCache.size === 0) {
    const allImageModels = imageModelsData;
    for (const model of allImageModels) {
      _imageModelsByIdCache.set(model.id, model);
    }
  }
  return _imageModelsByIdCache;
}

export function getImageModelDefinition(
  modelId: ImageModelId
): ImageModelDefinition {
  const modelsByIdDict = getImageModelsByIdDict();
  const model = modelsByIdDict.get(modelId);
  if (!model) {
    throw new Error(`Model ${modelId} not found`);
  }
  return model;
}

// Default models - using OpenRouter free models as defaults
export const DEFAULT_CHAT_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_PDF_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_TITLE_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_ARTIFACT_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_FOLLOWUP_SUGGESTIONS_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_ARTIFACT_SUGGESTION_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_IMAGE_MODEL: ImageModelId = "openai/gpt-image-1";
export const DEFAULT_CHAT_IMAGE_COMPATIBLE_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_SUGGESTIONS_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_POLISH_TEXT_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_FORMAT_AND_CLEAN_SHEET_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_ANALYZE_AND_VISUALIZE_SHEET_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";
export const DEFAULT_CODE_EDITS_MODEL: ModelId = "openrouter:x-ai/grok-4.1-fast:free";

// OpenRouter free models list (for anonymous users)
export const OPENROUTER_FREE_MODEL_IDS: ModelId[] = [
  "openrouter:x-ai/grok-4.1-fast:free",
  "openrouter:z-ai/glm-4.5-air:free",
  "openrouter:moonshotai/kimi-k2:free",
  "openrouter:meituan/longcat-flash-chat:free",
];
