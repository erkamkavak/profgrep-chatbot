"use client";

import { memo } from "react";
import {
  useMessagePartByPartIdx, useMessagePartTypesById
} from "@/lib/stores/hooks-message-parts";
import { MessageReasoning } from "./part/message-reasoning";
import { TextMessagePart } from "./part/text-message-part";
import {
  GetInstitutionsByPlace,
  GetProfessorsByInstitution,
  SearchAuthors,
  SearchInstitutions,
} from "./part/openalex";
import { MgrepSearch, MgrepStatus } from "./part/mgrep";

type MessagePartsProps = {
  messageId: string;
  isLoading: boolean;
  isReadonly: boolean;
};


// Render a single part by index with minimal subscriptions
function PureMessagePart({
  messageId,
  partIdx,
  isReadonly,
}: {
  messageId: string;
  partIdx: number;
  isReadonly: boolean;
}) {
  const part = useMessagePartByPartIdx(messageId, partIdx);
  const { type } = part;
  // const researchUpdates = useResearchUpdates(messageId, partIdx, type);
  // const chatStore = useChatStoreApi<ChatMessage>();

  // if (part.type === "tool-getWeather") {
  //   return <Weather key={part.toolCallId} tool={part} />;
  // }

  // if (type === "tool-createDocument") {
  //   const { toolCallId, state } = part;
  //   if (state === "input-available") {
  //     const { input } = part;
  //     return (
  //       <div key={toolCallId}>
  //         <DocumentPreview
  //           args={input}
  //           isReadonly={isReadonly}
  //           messageId={messageId}
  //         />
  //       </div>
  //     );
  //   }

  //   if (state === "output-available") {
  //     const { output, input } = part;
  //     const shouldShowFullPreview = isLastArtifact(
  //       chatStore.getState().getInternalMessages(),
  //       toolCallId
  //     );

  //     if ("error" in output) {
  //       return (
  //         <div className="rounded border p-2 text-red-500" key={toolCallId}>
  //           Error: {String(output.error)}
  //         </div>
  //       );
  //     }

  //     return (
  //       <div key={toolCallId}>
  //         {shouldShowFullPreview ? (
  //           <DocumentPreview
  //             args={input}
  //             isReadonly={isReadonly}
  //             messageId={messageId}
  //             result={output}
  //             type="create"
  //           />
  //         ) : (
  //           <DocumentToolResult
  //             isReadonly={isReadonly}
  //             messageId={messageId}
  //             result={output}
  //             type="create"
  //           />
  //         )}
  //       </div>
  //     );
  //   }
  // }

  // if (part.type === "tool-updateDocument") {
  //   return (
  //     <UpdateDocumentMessage
  //       isReadonly={isReadonly}
  //       key={part.toolCallId}
  //       messageId={messageId}
  //       tool={part}
  //     />
  //   );
  // }

  // if (part.type === "tool-requestSuggestions") {
  //   return (
  //     <RequestSuggestionsMessage
  //       isReadonly={isReadonly}
  //       key={part.toolCallId}
  //       messageId={messageId}
  //       tool={part}
  //     />
  //   );
  // }

  // if (part.type === "tool-retrieve") {
  //   return <Retrieve key={part.toolCallId} tool={part} />;
  // }

  // if (part.type === "tool-readDocument") {
  //   return <ReadDocument key={part.toolCallId} tool={part} />;
  // }

  // if (part.type === "tool-codeInterpreter") {
  //   return <CodeInterpreterMessage key={part.toolCallId} tool={part} />;
  // }

  // if (part.type === "tool-generateImage") {
  //   return <GeneratedImage key={part.toolCallId} tool={part} />;
  // }

  // if (type === "tool-deepResearch") {
  //   return renderDeepResearchPart({
  //     part,
  //     researchUpdates,
  //     chatStore,
  //     messageId,
  //     isReadonly,
  //   });
  // }

  // if (type === "tool-webSearch") {
  //   return renderWebSearchPart({ part, researchUpdates });
  // }

  if (part.type === "tool-getProfessorsByInstitution") {
    return <GetProfessorsByInstitution key={part.toolCallId} tool={part} />;
  }

  if (part.type === "tool-getInstitutionsByPlace") {
    return <GetInstitutionsByPlace key={part.toolCallId} tool={part} />;
  }

  if (part.type === "tool-searchAuthors") {
    return <SearchAuthors key={part.toolCallId} tool={part} />;
  }

  if (part.type === "tool-searchInstitutions") {
    return <SearchInstitutions key={part.toolCallId} tool={part} />;
  }

  if (part.type === "tool-mgrepSearch") {
    return <MgrepSearch key={part.toolCallId} tool={part} />;
  }

  if (part.type === "tool-mgrepStatus") {
    return <MgrepStatus key={part.toolCallId} tool={part} />;
  }

  return null;
}

const MessagePart = memo(PureMessagePart);

// Render a single reasoning part by index
function PureReasoningPart({
  messageId,
  isLoading,
  partIdx,
}: {
  messageId: string;
  isLoading: boolean;
  partIdx: number;
}) {
  const part = useMessagePartByPartIdx(messageId, partIdx);
  if (part.type !== "reasoning") {
    return null;
  }

  return <MessageReasoning content={part.text} isLoading={isLoading} />;
}

const ReasoningPart = memo(PureReasoningPart);

export function PureMessageParts({
  messageId,
  isLoading,
  isReadonly,
}: MessagePartsProps) {
  const types = useMessagePartTypesById(messageId);

  return types.map((t, i) => {
    if (t === "reasoning") {
      const key = `message-${messageId}-reasoning-${i}`;
      const isLast = i === types.length - 1;
      return (
        <ReasoningPart
          isLoading={isLoading && isLast}
          key={key}
          messageId={messageId}
          partIdx={i}
        />
      );
    }

    if (t === "text") {
      const key = `message-${messageId}-text-${i}`;
      return <TextMessagePart key={key} messageId={messageId} partIdx={i} />;
    }

    const key = `message-${messageId}-part-${i}-${t}`;
    return (
      <MessagePart
        isReadonly={isReadonly}
        key={key}
        messageId={messageId}
        partIdx={i}
      />
    );
  });
}

export const MessageParts = memo(PureMessageParts);
