import type { ModelId } from "@airegistry/vercel-gateway";
import type { FileUIPart, ModelMessage } from "ai";
import { createMgrepTools } from "@/lib/ai/tools/mgrep";
import {
    getProfessorsByInstitutionTool,
    getInstitutionsByPlaceTool,
    searchAuthorsTool,
    searchInstitutionsTool,
} from "@/lib/ai/tools/openalex";
import type { Session } from "@/lib/auth";
import type { StreamWriter } from "../types";

export function getTools({
  dataStream,
  session,
  messageId,
  selectedModel,
  attachments = [],
  lastGeneratedImage = null,
  contextForLLM,
  mixedbreadApiKey,
}: {
  dataStream: StreamWriter;
  session: Session;
  messageId: string;
  selectedModel: ModelId;
  attachments: FileUIPart[];
  lastGeneratedImage: { imageUrl: string; name: string } | null;
  contextForLLM: ModelMessage[];
  mixedbreadApiKey?: string;
}) {
  const userId = session.user?.id ?? null;
  const anonymousSessionId = null;

  const { mgrepSearchTool, mgrepStatusTool } = createMgrepTools(
    mixedbreadApiKey
  );

  return {
    mgrepSearch: mgrepSearchTool,
    mgrepStatus: mgrepStatusTool,
    getProfessorsByInstitution: getProfessorsByInstitutionTool({
      dataStream,
      userId,
      anonymousSessionId,
    }),
    getInstitutionsByPlace: getInstitutionsByPlaceTool,
    searchAuthors: searchAuthorsTool,
    searchInstitutions: searchInstitutionsTool,
  };
}
