import type { ChatMessage, ToolName } from "@/lib/ai/types";

export function addExplicitToolRequestToMessages(
  messages: ChatMessage[],
  _activeTools: ToolName[],
  explicitlyRequestedTools: ToolName[] | null
) {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return;
  }
  let toolsToRequest: ToolName[] = [];

  if (explicitlyRequestedTools) {
    // Explicitly requested tools
    console.log(
      "Indicating explicitly requested tools",
      explicitlyRequestedTools
    );
    toolsToRequest = explicitlyRequestedTools;
  }

  if (toolsToRequest.length > 0 && lastMessage) {
    lastMessage.parts.push({
      type: "text",
      text: `I want to use the tools ${toolsToRequest.join(", or ")})`,
    });
  }
}
