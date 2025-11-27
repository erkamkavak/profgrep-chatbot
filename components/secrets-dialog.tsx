"use client";

import { Check, ExternalLink, Eye, EyeOff, Key, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    type ProviderId,
    type ProviderKeys,
    PROVIDER_CONFIGS,
    getProviderKeys,
    removeProviderKey,
    setProviderKey,
} from "@/lib/provider-keys";

interface ProviderKeyInputProps {
  providerId: ProviderId;
  savedKey: string | undefined;
  onSave: (key: string) => void;
  onRemove: () => void;
}

function ProviderKeyInput({
  providerId,
  savedKey,
  onSave,
  onRemove,
}: ProviderKeyInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const config = PROVIDER_CONFIGS[providerId];

  const hasKey = !!savedKey;
  const maskedKey = savedKey ? `${savedKey.slice(0, 8)}...${savedKey.slice(-4)}` : "";

  const handleSave = () => {
    if (inputValue.trim()) {
      onSave(inputValue.trim());
      setInputValue("");
      setIsEditing(false);
    }
  };

  const handleRemove = () => {
    onRemove();
    setInputValue("");
    setIsEditing(false);
  };

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{config.name}</span>
          {hasKey && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-green-700 text-xs dark:bg-green-900/30 dark:text-green-400">
              <Check className="h-3 w-3" />
              Active
            </span>
          )}
        </div>
        <a
          href={config.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground"
        >
          Get API Key
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <p className="text-muted-foreground text-sm">{config.description}</p>

      {hasKey && !isEditing ? (
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-sm">
              {showKey ? savedKey : maskedKey}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Input
            type={showKey ? "text" : "password"}
            placeholder={config.keyPlaceholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            className="flex-1 font-mono"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button onClick={handleSave} disabled={!inputValue.trim()}>
            Save
          </Button>
          {isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function SecretsDialog({ children }: { children: React.ReactNode }) {
  const [keys, setKeys] = useState<ProviderKeys>({});
  const [open, setOpen] = useState(false);

  // Load keys from localStorage when dialog opens
  useEffect(() => {
    if (open) {
      setKeys(getProviderKeys());
    }
  }, [open]);

  const handleSaveKey = useCallback((providerId: ProviderId, key: string) => {
    setProviderKey(providerId, key);
    setKeys(getProviderKeys());
  }, []);

  const handleRemoveKey = useCallback((providerId: ProviderId) => {
    removeProviderKey(providerId);
    setKeys(getProviderKeys());
  }, []);

  // Order providers (excluding openrouter since it doesn't need user API key)
  const providerOrder: ProviderId[] = ["openai", "anthropic", "google", "xai"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </DialogTitle>
          <DialogDescription>
            Add your API keys to unlock additional AI models. OpenRouter free models are always available. Keys are stored
            locally in your browser and sent directly to providers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {providerOrder.map((providerId) => (
            <ProviderKeyInput
              key={providerId}
              providerId={providerId}
              savedKey={keys[providerId]}
              onSave={(key) => handleSaveKey(providerId, key)}
              onRemove={() => handleRemoveKey(providerId)}
            />
          ))}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800 text-sm dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
          <strong>Note:</strong> API keys are stored in your browser's local
          storage and are sent with each request. They are never stored on our
          servers.
        </div>
      </DialogContent>
    </Dialog>
  );
}
