import {
  Tool,
  ToolContent,
  ToolHeader,
} from "@/components/ai-elements/tool";
import type { ChatMessage } from "@/lib/ai/types";
import { ChevronDown, Database, FileText, Search } from "lucide-react";
import { useState } from "react";

export type MgrepSearchTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-mgrepSearch" }
>;

export type MgrepStatusTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-mgrepStatus" }
>;

function SearchResultItem({ result }: { result: Record<string, unknown> }) {
  const text = (result.text as string) || (result.content as string) || "";
  const score = (result.score as number) || 0;
  const metadata = (result.metadata as Record<string, unknown>) || {};
  const filenameFromResult = (result.filename as string) || "";
  const path = (metadata.path as string) || "";

  const baseNameFromPath = path ? path.split("/").pop() || "" : "";

  // Derive a human-friendly title
  const lines = text.split("\n");
  const headingLine = lines.find((line) => line.trim().startsWith("# "));
  const headingTitle = headingLine
    ? headingLine.replace(/^#\s+/, "").trim()
    : "";

  const title =
    headingTitle || filenameFromResult || baseNameFromPath || "Matching text";

  const previewSource = text.trim();
  const preview = previewSource.slice(0, 260);

  return (
    <div className="group flex flex-col gap-1 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate font-medium text-sm">{title}</span>
        </div>
        <span className="shrink-0 font-mono text-muted-foreground text-xs">
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      {preview && (
        <p className="line-clamp-2 pl-6 text-muted-foreground text-xs">
          {preview}
          {previewSource.length > preview.length ? "..." : ""}
        </p>
      )}
    </div>
  );
}

export function MgrepSearch({ tool }: { tool: MgrepSearchTool }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const query = tool.input?.query || "documents";

  if (tool.state === "input-available") {
    return (
      <Tool open={isExpanded} onOpenChange={setIsExpanded}>
        <ToolHeader
          state={tool.state}
          title={`Searching: "${query}"`}
          type="tool-mgrepSearch"
          icon={Search}
        />
        <ToolContent>
          <div className="p-4 text-center text-muted-foreground text-sm">
            Searching documents...
          </div>
        </ToolContent>
      </Tool>
    );
  }

  const output = tool.output as Record<string, unknown> | undefined;

  if (!output?.success) {
    return (
      <Tool open={isExpanded} onOpenChange={setIsExpanded}>
        <ToolHeader
          state="output-error"
          title={`Search failed: "${query}"`}
          type="tool-mgrepSearch"
          icon={Search}
        />
        <ToolContent>
          <div className="bg-destructive/10 p-4 text-destructive text-sm">
            {(output?.error as string) || "Unknown error occurred"}
          </div>
        </ToolContent>
      </Tool>
    );
  }

  const rawResults = output.results as
    | { object?: string; data?: Record<string, unknown>[] }
    | Record<string, unknown>[]
    | undefined;

  const resultsArray: Record<string, unknown>[] = Array.isArray(rawResults)
    ? rawResults
    : Array.isArray((rawResults as any)?.data)
    ? ((rawResults as any).data as Record<string, unknown>[])
    : [];

  const resultCount = resultsArray.length;

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Document search: "${query}" (${resultCount})`}
        type="tool-mgrepSearch"
        icon={Search}
      />
      <ToolContent className="border-t">
        {resultCount > 0 ? (
          <div>
            <div className="max-h-[400px] overflow-y-auto">
              {resultsArray.slice(0, 5).map((result, idx) => (
                <SearchResultItem
                  key={`result-${idx}`}
                  result={result as Record<string, unknown>}
                />
              ))}
              {resultsArray.length > 5 && (
                <details className="group">
                  <summary className="flex cursor-pointer items-center justify-center gap-2 bg-muted/30 px-4 py-2 text-muted-foreground text-xs hover:bg-muted/50 transition-colors">
                    <span>Show {resultsArray.length - 5} more results</span>
                    <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="border-t">
                    {resultsArray.slice(5).map((result, idx) => (
                      <SearchResultItem
                        key={`result-more-${idx}`}
                        result={result as Record<string, unknown>}
                      />
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No matching documents found
          </div>
        )}
      </ToolContent>
    </Tool>
  );
}

export function MgrepStatus({ tool }: { tool: MgrepStatusTool }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (tool.state === "input-available") {
    return (
      <Tool open={isExpanded} onOpenChange={setIsExpanded}>
        <ToolHeader
          state={tool.state}
          title="Checking store status..."
          type="tool-mgrepStatus"
          icon={Database}
        />
      </Tool>
    );
  }

  const output = tool.output as Record<string, unknown> | undefined;
  
  if (!output?.success) {
     return (
       <Tool open={isExpanded} onOpenChange={setIsExpanded}>
         <ToolHeader
           state="output-error"
           title="Status check failed"
           type="tool-mgrepStatus"
           icon={Database}
         />
       </Tool>
     );
  }

  const store = (output.store as string) || "Store";
  const info = (output.info as Record<string, unknown>) || {};
  const documentCount = (info.document_count as number) || 0;

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Store Status: ${store} (${documentCount.toLocaleString()} docs)`}
        type="tool-mgrepStatus"
        icon={Database}
      />
      <ToolContent className="border-t p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
             <div>
                 <div className="text-muted-foreground text-xs uppercase">Documents</div>
                 <div className="font-medium">{documentCount.toLocaleString()}</div>
             </div>
             <div>
                 <div className="text-muted-foreground text-xs uppercase">Store Path</div>
                 <div className="truncate font-medium" title={store}>{store}</div>
             </div>
          </div>
      </ToolContent>
    </Tool>
  );
}
