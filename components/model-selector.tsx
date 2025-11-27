"use client";

import { memo, useEffect, useMemo, useState } from "react";
import {
    ModelSelectorBase,
    type ModelSelectorBaseItem,
} from "@/components/model-selector-base";
import type { AppModelDefinition } from "@/lib/ai/app-models";
import {
    type AppModelId,
    chatModels,
    getAppModelDefinition,
    getProviderFromModelId,
} from "@/lib/ai/app-models";
import { getProviderKeys, type ProviderId } from "@/lib/provider-keys";
import { ANONYMOUS_LIMITS } from "@/lib/types/anonymous";
import { cn } from "@/lib/utils";
import { useSession } from "@/providers/session-provider";

export function PureModelSelector({
  selectedModelId,
  className,
  onModelChangeAction,
}: {
  selectedModelId: AppModelId;
  onModelChangeAction?: (modelId: AppModelId) => void;
  className?: string;
}) {
  const { data: session } = useSession();
  const isAnonymous = !session?.user;
  const [activeProviders, setActiveProviders] = useState<ProviderId[]>(["openrouter"]);

  // Check for active providers on mount and when localStorage changes
  useEffect(() => {
    const updateActiveProviders = () => {
      const keys = getProviderKeys();
      const active: ProviderId[] = ["openrouter"]; // OpenRouter always active
      for (const provider of ["openai", "anthropic", "google", "xai"] as ProviderId[]) {
        if (keys[provider]) {
          active.push(provider);
        }
      }
      setActiveProviders(active);
    };

    updateActiveProviders();

    // Listen for storage changes (when user updates keys in another tab or dialog)
    const handleStorageChange = () => updateActiveProviders();
    window.addEventListener("storage", handleStorageChange);
    
    // Also poll for changes since storage event doesn't fire in same tab
    const interval = setInterval(updateActiveProviders, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  const models: ModelSelectorBaseItem<AppModelId, AppModelDefinition>[] =
    useMemo(
      () =>
        chatModels.map((m) => {
          const def = getAppModelDefinition(m.id);
          const providerId = getProviderFromModelId(m.id);
          
          // Model is disabled if:
          // 1. User is anonymous and model is not in free models list
          // 2. Provider doesn't have an API key configured (except openrouter)
          const isProviderActive = activeProviders.includes(providerId);
          const isAnonymousRestricted = isAnonymous && !ANONYMOUS_LIMITS.AVAILABLE_MODELS.includes(m.id as any);
          const disabled = isAnonymousRestricted || !isProviderActive;
          
          return { id: m.id, definition: def, disabled };
        }),
      [isAnonymous, activeProviders]
    );

  const hasDisabledModels = useMemo(
    () => models.some((m) => m.disabled),
    [models]
  );

  const hasProviderDisabledModels = useMemo(
    () => models.some((m) => {
      const providerId = getProviderFromModelId(m.id);
      return !activeProviders.includes(providerId);
    }),
    [models, activeProviders]
  );

  return (
    <ModelSelectorBase
      className={cn("w-fit md:px-2", className)}
      enableFilters
      models={models}
      onModelChange={onModelChangeAction}
      selectedModelId={selectedModelId}
      topContent={
        hasDisabledModels ? (
          <div className="space-y-2 p-3">
            {hasProviderDisabledModels && !isAnonymous && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-muted-foreground text-xs">
                Add API keys in Settings to unlock more models.
              </div>
            )}
          </div>
        ) : null
      }
    />
  );
}

export const ModelSelector = memo(
  PureModelSelector,
  (prevProps, nextProps) =>
    prevProps.selectedModelId === nextProps.selectedModelId &&
    prevProps.className === nextProps.className &&
    prevProps.onModelChangeAction === nextProps.onModelChangeAction
);
