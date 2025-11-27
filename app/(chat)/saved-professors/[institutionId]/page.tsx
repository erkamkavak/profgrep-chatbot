import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getProfessorsProfileByInstitution } from "@/lib/db/queries";

type Professor = {
  name: string;
  openAlexId?: string;
  lastInstitution?: string;
  topics: string[];
  mean2yrCitedness?: number;
};

function parseProfessorsMarkdown(content: string): Professor[] {
  const blocks = content.split(/\n---\n/g);
  const professors: Professor[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    const lines = block.split("\n");
    const headingLine = lines.find((l) => l.trim().startsWith("# "));
    const name = headingLine
      ? headingLine.replace(/^#\s+/, "").trim()
      : "Unknown";

    let openAlexId: string | undefined;
    let lastInstitution: string | undefined;
    let mean2yr: number | undefined;
    const topics: string[] = [];

    let inTopics = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("- OpenAlex ID:")) {
        openAlexId = trimmed.replace("- OpenAlex ID:", "").trim();
      } else if (trimmed.startsWith("- Last known institution:")) {
        lastInstitution = trimmed
          .replace("- Last known institution:", "")
          .trim();
      } else if (trimmed.startsWith("- 2-year mean citedness:")) {
        const num = parseFloat(
          trimmed.replace("- 2-year mean citedness:", "").trim()
        );
        if (!Number.isNaN(num)) {
          mean2yr = num;
        }
      } else if (trimmed.startsWith("## Main topics")) {
        inTopics = true;
      } else if (trimmed.startsWith("## ") && !trimmed.startsWith("## Main topics")) {
        inTopics = false;
      } else if (inTopics && trimmed.startsWith("- ")) {
        topics.push(trimmed.slice(2).trim());
      }
    }

    professors.push({
      name,
      openAlexId,
      lastInstitution,
      topics,
      mean2yrCitedness: mean2yr,
    });
  }

  professors.sort((a, b) => {
    const av = a.mean2yrCitedness ?? 0;
    const bv = b.mean2yrCitedness ?? 0;
    return bv - av;
  });

  return professors;
}

async function getUserContext() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;
  return { userId, anonymousSessionId: null as string | null };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}): Promise<Metadata> {
  const { institutionId: id } = await params;
  let title = `Professors for ${id}`;

  try {
    const res = await fetch(
      `https://api.openalex.org/institutions/${encodeURIComponent(id)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        title = `Professors at ${data.display_name as string}`;
      }
    }
  } catch {
    // ignore metadata fetch errors
  }

  return { title };
}

export default async function InstitutionProfessorsPage({
  params,
}: {
  params: Promise<{ institutionId: string }>;
}) {
  const { institutionId } = await params;

  const { userId, anonymousSessionId } = await getUserContext();

  const profile = await getProfessorsProfileByInstitution({
    userId,
    anonymousSessionId,
    institutionId,
  });

  if (!profile || !profile.markdown?.trim()) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
        <h1 className="text-xl font-semibold tracking-tight">
          No saved professors for this institution
        </h1>
        <p className="text-muted-foreground text-sm">
          Run the professors tool for this institution to generate local
          profiles.
        </p>
      </div>
    );
  }

  const professors = parseProfessorsMarkdown(profile.markdown);

  let institutionName: string | undefined;
  try {
    const res = await fetch(
      `https://api.openalex.org/institutions/${encodeURIComponent(
        institutionId
      )}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.display_name) {
        institutionName = data.display_name as string;
      }
    }
  } catch {
    // ignore lookup errors
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {institutionName ?? institutionId}
        </h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Saved professor profiles for this institution, sorted by 2-year mean
          citedness.
        </p>
      </div>

      {professors.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No professor profiles found in the local file yet.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {professors.map((prof) => (
          <div
            key={prof.name}
            className="rounded-md border bg-card px-3 py-2 text-sm"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium text-sm">{prof.name}</div>
                {prof.lastInstitution && (
                  <div className="truncate text-muted-foreground text-xs">
                    {prof.lastInstitution}
                  </div>
                )}
              </div>
              {prof.mean2yrCitedness != null && (
                <div className="shrink-0 text-right text-[11px] text-muted-foreground">
                  2yr mean citedness {prof.mean2yrCitedness.toFixed(2)}
                </div>
              )}
            </div>
            {prof.topics.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {prof.topics.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
