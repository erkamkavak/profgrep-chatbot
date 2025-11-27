import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProfessorsProfiles } from "@/lib/db/queries";

type InstitutionSummary = {
  id: string;
  name: string;
  maxMean2yrCitedness?: number;
  professorCount: number;
};

// Extract all 2-year mean citedness values from a professors.md
function parseMean2yrValues(content: string): number[] {
  const values: number[] = [];
  const blocks = content.split(/\n---\n/g);
  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- 2-year mean citedness:")) {
        const num = parseFloat(
          trimmed.replace("- 2-year mean citedness:", "").trim()
        );
        if (!Number.isNaN(num)) values.push(num);
      }
    }
  }
  return values;
}

async function getUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;
  return { userId, anonymousSessionId: null as string | null };
}

async function loadInstitutions(): Promise<InstitutionSummary[]> {
  const { userId, anonymousSessionId } = await getUserContext();
  const profiles = await getProfessorsProfiles({
    userId,
    anonymousSessionId,
  });

  const groups: InstitutionSummary[] = profiles
    .map((p) => {
      const content = p.markdown;
      if (!content?.trim()) return null as InstitutionSummary | null;

      const meanValues = parseMean2yrValues(content);
      const maxMean2yr =
        meanValues.length > 0 ? Math.max(...meanValues) : undefined;

      const professorHeadings = [
        ...content.matchAll(/^#\s+(.+)$/gm),
      ].map((m) => m[1].trim());

      return {
        id: p.institutionId,
        name: p.institutionId, // will replace with OpenAlex display_name below
        maxMean2yrCitedness: maxMean2yr,
        professorCount: professorHeadings.length,
      } as InstitutionSummary;
    })
    .filter(
      (x): x is InstitutionSummary => x !== null && x.professorCount > 0
    );

  // Enrich with OpenAlex display_name
  const enriched = await Promise.all(
    groups.map(async (inst) => {
      let displayName = inst.id;
      const id = inst.id.startsWith("I") ? inst.id : inst.id.split("/").pop()!;
      try {
        const res = await fetch(
          `https://api.openalex.org/institutions/${encodeURIComponent(id)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.display_name) {
            displayName = data.display_name as string;
          }
        }
      } catch {
        // ignore lookup errors
      }
      return { ...inst, name: displayName };
    })
  );

  // Sort by highest 2yr mean citedness
  enriched.sort((a, b) => {
    const av = a.maxMean2yrCitedness ?? 0;
    const bv = b.maxMean2yrCitedness ?? 0;
    return bv - av;
  });

  return enriched;
}

export default async function SavedProfessorsIndexPage() {
  const institutions = await loadInstitutions();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Saved Professors
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Institutions for which professor profiles have been saved locally.
        </p>
      </div>

      {institutions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No professor profiles found yet. Run the professors tool for an
          institution to generate profiles.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {institutions.map((inst) => (
          <Link
            key={inst.id}
            href={{ pathname: "/saved-professors/" + inst.id }}
          >
            <div className="rounded-md border bg-card px-4 py-5 text-sm transition-colors hover:bg-muted/70">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{inst.name}</h2>
                  <p className="truncate text-muted-foreground text-xs">
                    {inst.professorCount} professor
                    {inst.professorCount === 1 ? "" : "s"}
                    {inst.maxMean2yrCitedness != null && (
                      <>
                        {" · top 2yr mean citedness "}
                        {inst.maxMean2yrCitedness.toFixed(2)}
                      </>
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  OpenAlex ID: {inst.id}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}