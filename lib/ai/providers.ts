import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { env } from "@/lib/env";
import type { ProviderKeys } from "../provider-keys";
import type { ImageModelId } from "../models/image-model-id";
import type { AppModelId, ModelId, ModelProviderId } from "./app-models";
import {
  getAppModelDefinition,
  getImageModelDefinition,
  getProviderFromModelId,
} from "./app-models";

// Create provider instances with API keys
function createProviderWithKey(providerId: ModelProviderId, apiKey?: string) {
  switch (providerId) {
    case "openai":
      return apiKey ? createOpenAI({ apiKey }) : null;
    case "anthropic":
      return apiKey ? createAnthropic({ apiKey }) : null;
    case "google":
      return apiKey ? createGoogleGenerativeAI({ apiKey }) : null;
    case "xai":
      return apiKey ? createXai({ apiKey }) : null;
    case "openrouter":
      // OpenRouter uses server-side API key from env
      return createOpenRouter({ apiKey: apiKey || env.OPENROUTER_API_KEY });
    default:
      return null;
  }
}

// Get language model with user-provided API keys
// Accepts string for backwards compatibility with external model IDs
export const getLanguageModel = (
  modelId: ModelId | string,
  providerKeys?: ProviderKeys
) => {
  // For external model IDs (from @airegistry/vercel-gateway), use OpenRouter
  const isExternalModelId = !modelId.includes(":") || modelId.startsWith("openrouter:");
  
  if (isExternalModelId && !modelId.startsWith("openrouter:")) {
    // External model ID - route through OpenRouter
    const openrouter = createOpenRouter({ apiKey: providerKeys?.openrouter || env.OPENROUTER_API_KEY });
    return openrouter(modelId);
  }
  
  const model = getAppModelDefinition(modelId as ModelId);
  const providerId = getProviderFromModelId(modelId as ModelId);

  // Get the appropriate provider
  const apiKey = providerKeys?.[providerId];
  const provider = createProviderWithKey(providerId, apiKey);

  if (!provider) {
    throw new Error(
      `Provider ${providerId} not configured. Please add your API key in Settings.`
    );
  }

  // Create the language model
  let languageModel: any;

  if (providerId === "openrouter") {
    // OpenRouter uses the full model path
    languageModel = provider(model.apiModelId);
  } else {
    // Other providers use just the model ID
    languageModel = provider(model.apiModelId);
  }

  // Wrap with reasoning middleware if needed
  if (model.reasoning) {
    return wrapLanguageModel({
      model: languageModel,
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    });
  }

  return languageModel;
};

// Get image model (still uses server-side OpenAI key)
export const getImageModel = (modelId: ImageModelId, providerKeys?: ProviderKeys) => {
  const model = getImageModelDefinition(modelId);
  if (model.owned_by === "openai") {
    const apiKey = providerKeys?.openai;
    if (!apiKey) {
      throw new Error("OpenAI API key required for image generation");
    }
    const openai = createOpenAI({ apiKey });
    return openai.image(model.id.replace("openai/", "") as any);
  }
  throw new Error(`Provider ${model.owned_by} not supported for image generation`);
};

export const getModelProviderOptions = (
  _providerModelId: AppModelId
): Record<string, never> => {
  return {};
};
