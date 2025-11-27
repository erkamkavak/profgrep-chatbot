import {
  Tool,
  ToolContent,
  ToolHeader,
} from "@/components/ai-elements/tool";
import type { ChatMessage } from "@/lib/ai/types";
import {
  Building2,
  ChevronDown,
  GraduationCap,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";

// Tool part types
export type GetProfessorsByInstitutionTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getProfessorsByInstitution" }
>;

export type GetInstitutionsByPlaceTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-getInstitutionsByPlace" }
>;

export type SearchAuthorsTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-searchAuthors" }
>;

export type SearchInstitutionsTool = Extract<
  ChatMessage["parts"][number],
  { type: "tool-searchInstitutions" }
>;

function ProfessorItem({ author }: { author: Record<string, unknown> }) {
  const name = (author.display_name as string) || "Unknown";
  const worksCount = (author.works_count as number) || 0;
  const citedByCount = (author.cited_by_count as number) || 0;
  const institution =
    (author.last_institution_name as string) ||
    (author.last_known_institution as string) ||
    "";
  const summaryStats = (author.summary_stats || {}) as {
    h_index?: number;
    [key: string]: unknown;
  };
  const hIndex =
    typeof summaryStats.h_index === "number" ? summaryStats.h_index : undefined;

  return (
    <div className="group flex items-start gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors">
      <GraduationCap className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium text-sm truncate">{name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{worksCount} works</span>
        </div>
        {institution && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                <span className="truncate">{institution}</span>
            </div>
        )}
        <div className="flex gap-3 text-[10px] text-muted-foreground">
            <span>{citedByCount.toLocaleString()} citations</span>
            {hIndex != null && <span>h-index {hIndex}</span>}
        </div>
      </div>
    </div>
  );
}

function InstitutionItem({
  institution,
}: {
  institution: Record<string, unknown>;
}) {
  const name = (institution.display_name as string) || "Unknown";
  const country = (institution.country_code as string) || "";
  const worksCount = (institution.works_count as number) || 0;

  return (
    <div className="group flex items-center gap-3 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition-colors">
      <Building2 className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium text-sm">{name}</div>
        <div className="flex gap-3 text-muted-foreground text-xs mt-0.5">
          {country && <span>{country}</span>}
          <span>{worksCount.toLocaleString()} works</span>
        </div>
      </div>
    </div>
  );
}

function OpenAlexList({
    items,
    renderItem,
    maxVisible = 5,
    emptyMessage = "No results found",
  }: {
    items: unknown[];
    renderItem: (item: unknown, index: number) => React.ReactNode;
    maxVisible?: number;
    emptyMessage?: string;
  }) {
    if (!items || items.length === 0) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          {emptyMessage}
        </div>
      );
    }
  
    const visibleItems = items.slice(0, maxVisible);
    const hasMore = items.length > maxVisible;
  
    return (
      <div>
        <div>
          {visibleItems.map((item, idx) => renderItem(item, idx))}
        </div>
        {hasMore && (
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-center gap-2 bg-muted/30 px-4 py-2 text-muted-foreground text-xs hover:bg-muted/50 transition-colors">
              <span>Show {items.length - maxVisible} more</span>
              <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t">
              {items.slice(maxVisible).map((item, idx) =>
                renderItem(item, idx + maxVisible)
              )}
            </div>
          </details>
        )}
      </div>
    );
}

export function GetProfessorsByInstitution({
  tool,
}: {
  tool: GetProfessorsByInstitutionTool;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const query = tool.input?.institutionQuery || "institution";

  if (tool.state === "input-available") {
     return (
         <Tool open={isExpanded} onOpenChange={setIsExpanded}>
             <ToolHeader
                 state={tool.state}
                 title={`Searching professors in "${query}"`}
                 type="tool-getProfessorsByInstitution"
                 icon={Users}
             />
             <ToolContent>
                 <div className="p-4 text-center text-muted-foreground text-sm">Loading professors...</div>
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
                 title="Failed to fetch professors"
                 type="tool-getProfessorsByInstitution"
                 icon={Users}
             />
             <ToolContent>
                 <div className="bg-destructive/10 p-4 text-destructive text-sm">
                    {(output?.error as string) || "Unknown error occurred"}
                 </div>
             </ToolContent>
         </Tool>
     );
  }

  const authors = (output.authors as Record<string, unknown>[]) || [];
  const institutionQuery = (output.institutionQuery as string) || "Institution";
  const totalCount = (output.count as number) || authors.length;

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Professors from ${institutionQuery} (${totalCount})`}
        type="tool-getProfessorsByInstitution"
        icon={Users}
      />
      <ToolContent className="border-t">
        <OpenAlexList
            items={authors}
            renderItem={(item, idx) => (
                <ProfessorItem author={item as Record<string, unknown>} key={`prof-${idx}`} />
            )}
            emptyMessage="No professors found"
        />
      </ToolContent>
    </Tool>
  );
}

export function GetInstitutionsByPlace({
  tool,
}: {
  tool: GetInstitutionsByPlaceTool;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const place = tool.input?.place || "location";

  if (tool.state === "input-available") {
      return (
          <Tool open={isExpanded} onOpenChange={setIsExpanded}>
              <ToolHeader
                  state={tool.state}
                  title={`Searching institutions in "${place}"`}
                  type="tool-getInstitutionsByPlace"
                  icon={MapPin}
              />
              <ToolContent>
                  <div className="p-4 text-center text-muted-foreground text-sm">Loading institutions...</div>
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
                  title="Failed to fetch institutions"
                  type="tool-getInstitutionsByPlace"
                  icon={MapPin}
              />
              <ToolContent>
                  <div className="bg-destructive/10 p-4 text-destructive text-sm">
                     {(output?.error as string) || "Unknown error occurred"}
                  </div>
              </ToolContent>
          </Tool>
      );
  }

  const institutions =
    (output.institutions as Record<string, unknown>[]) || [];
  const placeName = (output.place as string) || "Location";

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Institutions in ${placeName} (${institutions.length})`}
        type="tool-getInstitutionsByPlace"
        icon={MapPin}
      />
      <ToolContent className="border-t">
        <OpenAlexList
            items={institutions}
            renderItem={(item, idx) => (
                <InstitutionItem institution={item as Record<string, unknown>} key={`inst-${idx}`} />
            )}
            emptyMessage="No institutions found"
        />
      </ToolContent>
    </Tool>
  );
}

export function SearchAuthors({ tool }: { tool: SearchAuthorsTool }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const query = tool.input?.query || "authors";

  if (tool.state === "input-available") {
      return (
          <Tool open={isExpanded} onOpenChange={setIsExpanded}>
              <ToolHeader
                  state={tool.state}
                  title={`Searching authors: "${query}"`}
                  type="tool-searchAuthors"
                  icon={Search}
              />
              <ToolContent>
                  <div className="p-4 text-center text-muted-foreground text-sm">Searching authors...</div>
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
                  title="Search failed"
                  type="tool-searchAuthors"
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

  const authors = (output.authors as Record<string, unknown>[]) || [];
  const displayQuery = (output.query as string) || "Query";

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Author search: "${displayQuery}" (${authors.length})`}
        type="tool-searchAuthors"
        icon={Search}
      />
      <ToolContent className="border-t">
        <OpenAlexList
            items={authors}
            renderItem={(item, idx) => (
                <ProfessorItem author={item as Record<string, unknown>} key={`author-${idx}`} />
            )}
            emptyMessage="No authors found"
        />
      </ToolContent>
    </Tool>
  );
}

export function SearchInstitutions({ tool }: { tool: SearchInstitutionsTool }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const query = tool.input?.query || "institutions";

  if (tool.state === "input-available") {
      return (
          <Tool open={isExpanded} onOpenChange={setIsExpanded}>
              <ToolHeader
                  state={tool.state}
                  title={`Searching institutions: "${query}"`}
                  type="tool-searchInstitutions"
                  icon={Building2}
              />
              <ToolContent>
                  <div className="p-4 text-center text-muted-foreground text-sm">Searching institutions...</div>
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
                  title="Search failed"
                  type="tool-searchInstitutions"
                  icon={Building2}
              />
              <ToolContent>
                  <div className="bg-destructive/10 p-4 text-destructive text-sm">
                     {(output?.error as string) || "Unknown error occurred"}
                  </div>
              </ToolContent>
          </Tool>
      );
  }

  const institutions =
    (output.institutions as Record<string, unknown>[]) || [];
  const displayQuery = (output.query as string) || "Query";

  return (
    <Tool open={isExpanded} onOpenChange={setIsExpanded}>
      <ToolHeader
        state={tool.state}
        title={`Institution search: "${displayQuery}" (${institutions.length})`}
        type="tool-searchInstitutions"
        icon={Building2}
      />
      <ToolContent className="border-t">
        <OpenAlexList
            items={institutions}
            renderItem={(item, idx) => (
                <InstitutionItem institution={item as Record<string, unknown>} key={`inst-${idx}`} />
            )}
            emptyMessage="No institutions found"
        />
      </ToolContent>
    </Tool>
  );
}
