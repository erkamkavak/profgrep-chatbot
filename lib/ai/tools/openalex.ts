import { tool } from "ai";
import { z } from "zod";
import type { StreamWriter } from "../types";
import { embedMgrepFiles } from "./mgrep";

const OPENALEX_BASE_URL = "https://api.openalex.org";

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAlex request failed (${res.status}): ${text}`);
  }
  return res.json();
}

function formatProfessorMarkdown(author: any, institutionName: string | null) {
  const id = author.id ?? "";
  const displayName = author.display_name ?? "Unknown";
  const orcid = author.orcid ?? null;
  const worksCount = author.works_count ?? 0;
  const citedByCount = author.cited_by_count ?? 0;
  const lastInstitution =
    author.last_institution_name ?? author.last_known_institution ?? institutionName;
  const summaryStats = author.summary_stats ?? {};
  const topics = Array.isArray(author.topics) ? author.topics : [];
  const countsByYear = Array.isArray(author.counts_by_year)
    ? [...author.counts_by_year].sort((a: any, b: any) => b.year - a.year)
    : [];
  const worksApiUrl = author.works_api_url ?? null;

  const topTopics = topics.slice(0, 5).map((t: any) => {
    const field = t.field?.display_name ?? "";
    const domain = t.domain?.display_name ?? "";
    const ctx = [field, domain].filter(Boolean).join(" · ");
    return `- ${t.display_name}${ctx ? ` (${ctx})` : ""}`;
  });

  const recentActivity = countsByYear.slice(0, 5).map((y: any) => {
    return `- ${y.year}: works=${y.works_count ?? 0}, cited_by=${
      y.cited_by_count ?? 0
    }`;
  });

  return (
    `# ${displayName}\n\n` +
    `- OpenAlex ID: ${id}\n` +
    `- ORCID: ${orcid ?? "N/A"}\n` +
    `- Last known institution: ${lastInstitution ?? "N/A"}\n` +
    `- Works count: ${worksCount}\n` +
    `- Cited by count: ${citedByCount}\n` +
    (summaryStats.h_index != null
      ? `- h-index: ${summaryStats.h_index}\n`
      : "") +
    (summaryStats["2yr_mean_citedness"] != null
      ? `- 2-year mean citedness: ${summaryStats["2yr_mean_citedness"]}\n`
      : "") +
    (worksApiUrl ? `- Works API URL: ${worksApiUrl}\n` : "") +
    `\n` +
    (topTopics.length
      ? `## Main topics\n\n${topTopics.join("\n")}\n\n`
      : "") +
    (recentActivity.length
      ? `## Recent activity (by year)\n\n${recentActivity.join("\n")}\n\n`
      : "") +
    `## Notes\n\n` +
    `This file was generated from OpenAlex author data. You can extend it with a manual summary, key papers, or collaboration notes.\n`
  );
}

export const getProfessorsByInstitutionTool = ({
  dataStream,
  userId,
  anonymousSessionId,
}: {
  dataStream: StreamWriter;
  userId: string | null;
  anonymousSessionId: string | null;
}) =>
  tool({
    description:
      "Get a list of authors (professors) for a given institution, resolving the institution by name or ID via OpenAlex.",
    inputSchema: z.object({
      institutionQuery: z
        .string()
        .describe(
          "Institution identifier or name. Can be an OpenAlex ID (e.g. I123...), a full institution URL, or a free-text name."
        ),
      perPage: z
        .number()
        .min(1)
        .max(200)
        .optional()
        .default(200)
        .describe("Page size when paginating through all authors (1-200)."),
    }),
    execute: async ({
      institutionQuery,
      perPage,
    }: {
      institutionQuery: string;
      perPage?: number;
    }) => {
    try {
      let institutionId = institutionQuery.trim();

      if (institutionId.startsWith("http")) {
        const parts = institutionId.split("/");
        institutionId = parts[parts.length - 1];
      }

      if (!institutionId.startsWith("I")) {
        const searchUrl = `${OPENALEX_BASE_URL}/institutions?search=${encodeURIComponent(
          institutionId
        )}&per-page=1`;
        const instRes = await fetchJson(searchUrl);
        if (!instRes?.results?.length) {
          return {
            success: false,
            error: `No institution found for query: ${institutionQuery}`,
          };
        }
        institutionId = instRes.results[0].id;
      }

      const instOpenAlexId = institutionId.startsWith("http")
        ? institutionId
        : `${OPENALEX_BASE_URL}/institutions/${institutionId}`;

      const institutionKey = instOpenAlexId.split("/").pop() ?? institutionId;

      const pageSize = perPage ?? 200;
      const authors: any[] = [];
      let cursor: string | null = "*";
      let pageCount = 0;
      const maxPages = 5; // safety limit

      while (cursor && pageCount < maxPages) {
        const filter =
          `has_orcid:true,` +
          `last_known_institutions.id:${encodeURIComponent(instOpenAlexId)},` +
          `works_count:>0,` +
          `summary_stats.2yr_mean_citedness:>5`;
        const select = [
          "id",
          "display_name",
          "orcid",
          "works_count",
          "cited_by_count",
          "summary_stats",
          "counts_by_year",
          "topics",
          "x_concepts",
          "last_known_institutions",
          "works_api_url",
        ].join(",");

        const url = `${OPENALEX_BASE_URL}/authors?filter=${filter}&per-page=${pageSize}&cursor=${encodeURIComponent(
          cursor
        )}&select=${select}`;
        const data = await fetchJson(url);
        const pageResults = (data.results ?? []).map((a: any) => {
          const lastKnownList = Array.isArray(a.last_known_institutions)
            ? a.last_known_institutions
            : a.last_known_institution
            ? [a.last_known_institution]
            : [];

          const normalizeId = (id: string | null | undefined) =>
            id ? id.split("/").pop() : null;

          const targetInstKey = normalizeId(instOpenAlexId);

          const matchedInstitution = lastKnownList.find((inst: any) => {
            const instKey = normalizeId(inst?.id);
            return instKey && targetInstKey && instKey === targetInstKey;
          });

          const lastInstitutionName =
            matchedInstitution?.display_name ??
            lastKnownList[0]?.display_name ??
            a.last_known_institution?.display_name ??
            null;

          return {
            id: a.id,
            display_name: a.display_name,
            orcid: a.orcid ?? null,
            works_count: a.works_count,
            cited_by_count: a.cited_by_count,
            last_institution_name: lastInstitutionName,
            summary_stats: a.summary_stats ?? undefined,
            counts_by_year: a.counts_by_year ?? undefined,
            topics: a.topics ?? a.x_concepts ?? undefined,
            works_api_url: a.works_api_url ?? undefined,
          };
        });
        try {
          dataStream.write({
            type: "data-researchUpdate",
            data: {
              type: "thoughts",
              status: cursor ? "running" : "completed",
              title: `Fetching professors from institution`,
              message: `Fetched page ${pageCount + 1} with ${pageResults.length} authors (total so far: ${
                authors.length + pageResults.length
              }).`,
            },
          });
        } catch {
          // ignore streaming errors
        }
        authors.push(...pageResults);

        cursor = data.meta?.next_cursor ?? null;
        pageCount += 1;
      }

      let savedCount = 0;
      let combinedMarkdown = "";
      if (authors.length) {
        combinedMarkdown = authors
          .map((author) =>
            formatProfessorMarkdown(author, author.last_institution_name ?? null)
          )
          .join("\n\n---\n\n");
        savedCount = authors.length;
      }

      const storeName = `${process.env.MXBAI_STORE || "mgrep"}-${institutionKey}`;

      // Embed professors markdown into Mixedbread store (no DB persistence)
      try {
        if (combinedMarkdown) {
          await embedMgrepFiles({
            text: combinedMarkdown,
            store: storeName,
          });
        }
      } catch {
        // ignore embedding errors so main flow continues
      }

      const maxReturnedAuthors = 5;
      const authorsForResponse = authors.slice(0, maxReturnedAuthors);

      return {
        success: true,
        institutionQuery,
        institutionId: instOpenAlexId,
        count: authors.length,
        pagesFetched: pageCount,
        authors: authorsForResponse,
        savedCount,
        maxReturnedAuthors,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch professors: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },
});

export const getInstitutionsByPlaceTool = tool({
  description:
    "Get a list of institutions in a given country/place/region using OpenAlex institutions search.",
  inputSchema: z.object({
    placeQuery: z
      .string()
      .describe("Free-text place query such as country, city, or region (e.g. 'Germany', 'Tokyo')."),
    perPage: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe("Maximum number of institutions to return (1-50)."),
  }),
  execute: async ({ placeQuery, perPage }: { placeQuery: string; perPage?: number }) => {
    try {
      const url = `${OPENALEX_BASE_URL}/institutions?search=${encodeURIComponent(
        placeQuery
      )}&per-page=${perPage ?? 20}`;
      const data = await fetchJson(url);

      const institutions = (data.results ?? []).map((i: any) => ({
        id: i.id,
        display_name: i.display_name,
        country_code: i.country_code ?? null,
        type: i.type ?? null,
        homepage_url: i.homepage_url ?? null,
        ror: i.ror ?? null,
      }));

      return {
        success: true,
        placeQuery,
        count: institutions.length,
        institutions,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch institutions: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

export const searchAuthorsTool = tool({
  description:
    "Search OpenAlex authors (professors) by name or keywords and return a lightweight summary list.",
  inputSchema: z.object({
    query: z.string().describe("Search text for authors (e.g. name, topic)."),
    perPage: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe("Maximum number of authors to return (1-50)."),
  }),
  execute: async ({ query, perPage }: { query: string; perPage?: number }) => {
    try {
      const url = `${OPENALEX_BASE_URL}/authors?search=${encodeURIComponent(
        query
      )}&per-page=${perPage ?? 20}`;
      const data = await fetchJson(url);

      const authors = (data.results ?? []).map((a: any) => ({
        id: a.id,
        display_name: a.display_name,
        orcid: a.orcid ?? null,
        works_count: a.works_count,
        cited_by_count: a.cited_by_count,
        last_known_institution: a.last_known_institution?.display_name ?? null,
      }));

      return {
        success: true,
        query,
        count: authors.length,
        authors,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search authors: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

export const searchInstitutionsTool = tool({
  description:
    "Search OpenAlex institutions by name or keywords and return a lightweight summary list.",
  inputSchema: z.object({
    query: z.string().describe("Search text for institutions (e.g. university name, city)."),
    perPage: z
      .number()
      .min(1)
      .max(50)
      .optional()
      .default(20)
      .describe("Maximum number of institutions to return (1-50)."),
  }),
  execute: async ({ query, perPage }: { query: string; perPage?: number }) => {
    try {
      const url = `${OPENALEX_BASE_URL}/institutions?search=${encodeURIComponent(
        query
      )}&per-page=${perPage ?? 20}`;
      const data = await fetchJson(url);

      const institutions = (data.results ?? []).map((i: any) => ({
        id: i.id,
        display_name: i.display_name,
        country_code: i.country_code ?? null,
        type: i.type ?? null,
        homepage_url: i.homepage_url ?? null,
        ror: i.ror ?? null,
      }));

      return {
        success: true,
        query,
        count: institutions.length,
        institutions,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to search institutions: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  },
});
