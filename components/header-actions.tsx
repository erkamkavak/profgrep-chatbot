"use client";

import { Key, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { memo } from "react";
import { GitIcon } from "@/components/icons";
import { SecretsDialog } from "@/components/secrets-dialog";
import { Button } from "@/components/ui/button";
import { publicConfig } from "@/lib/public-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "@/providers/session-provider";

function PureHeaderActions() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <SecretsDialog>
        <Button 
          size="icon" 
          type="button" 
          variant="ghost" 
          title="API Keys"
          className="cursor-pointer"
        >
          <Key className="h-5 w-5" />
        </Button>
      </SecretsDialog>
      {!user && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-8 px-3"
              onClick={() => {
                router.push("/login");
                router.refresh();
              }}
              size="sm"
              variant="outline"
            >
              <LogIn className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Sign in</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sign in to your account</TooltipContent>
        </Tooltip>
      )}
      <Button asChild size="icon" type="button" variant="ghost">
        <a
          className="flex items-center justify-center"
          href={publicConfig.githubUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          <GitIcon size={20} />
        </a>
      </Button>
    </div>
  );
}

export const HeaderActions = memo(PureHeaderActions);
