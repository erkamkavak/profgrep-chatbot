import { tool } from "ai";
import { z } from "zod";
import Mixedbread from "@mixedbread/sdk";
import { env } from "@/lib/env";

function createMixedbreadClient(apiKey?: string) {
  const key = apiKey || env.MIXEDBREAD_API_KEY;
  return new Mixedbread({ apiKey: key });
}

async function ensureStore(client: Mixedbread, storeName: string) {
  try {
    const existing = await client.stores.retrieve(storeName);
    return existing;
  } catch (error: any) {
    if (error && typeof error === "object" && "status" in error && (error as any).status === 404) {
      return client.stores.create({
        name: storeName,
        description: "mgrep store - Mixedbread semantic search",
      });
    }
    throw error;
  }
}

export async function embedMgrepFiles({
  text,
  store,
  apiKey,
}: {
  text: string;
  store?: string;
  apiKey?: string;
}) {
  const client = createMixedbreadClient(apiKey);
  const storeName = store || process.env.MXBAI_STORE || "mgrep";

  await ensureStore(client, storeName);

  const blob = new Blob([text], { type: "text/markdown" });
  const file = await Mixedbread.toFile(blob, "professors.md");

  await client.stores.files.uploadAndPoll(storeName, file as any, {
    external_id: `${storeName}-professors`,
    overwrite: true,
    metadata: { kind: "professors" },
  } as any);
}

export const createMgrepTools = (apiKey?: string) => {
  const mgrepSearchTool = tool({
    description:
      "Search through mgrep-indexed files using a single, focused natural language query (do not batch multiple queries together).",
    inputSchema: z.object({
      query: z.string().describe("The natural language search query"),
      institution: z
        .string()
        .describe(
          "OpenAlex institution identifier used to select the professors folder (e.g. I123... or full OpenAlex URL).",
        ),
      maxCount: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of results to return"),
      showContent: z
        .boolean()
        .optional()
        .default(true)
        .describe("Whether to show file content in results"),
      generateAnswer: z
        .boolean()
        .optional()
        .default(false)
        .describe("Generate an answer based on the results"),
      store: z.string().optional().describe("Optional store name to use"),
    }),
    execute: async ({
      query,
      institution,
      maxCount,
      showContent,
      generateAnswer,
      store,
    }: {
      query: string;
      maxCount?: number;
      showContent?: boolean;
      generateAnswer?: boolean;
      store?: string;
      institution: string;
    }) => {
      try {
        // Guard against overly long or expanded boolean queries
        const orCount = (query.match(/\bOR\b/gi) || []).length;
        if (query.length > 240 || orCount > 4) {
          return {
            success: false,
            error:
              "Query is too broad or contains many OR clauses. Please use a single, focused natural language query instead of batching multiple queries.",
          };
        }

        const client = createMixedbreadClient(apiKey);
        const baseStoreName = process.env.MXBAI_STORE || "mgrep";

        let institutionId = institution.trim();
        if (institutionId.startsWith("http")) {
          const parts = institutionId.split("/");
          institutionId = parts[parts.length - 1];
        }
        const institutionKey = institutionId;
        const storeName = `${baseStoreName}-${institutionKey}`;

        const limit = maxCount ?? 10;

        console.log("[mgrepSearch] params", {
          query,
          maxCount,
          showContent,
          generateAnswer,
          store,
          institution,
          storeName,
          institutionKey,
          limit,
        });

        let results: unknown;
        if (!generateAnswer) {
          const res = await client.stores.search({
            query,
            store_identifiers: [storeName],
            top_k: limit,
            search_options: { rerank: true },
          } as any);
          results = res;
        } else {
          const res = await client.stores.questionAnswering({
            query,
            store_identifiers: [storeName],
            top_k: limit,
            search_options: { rerank: true },
          } as any);
          results = res;
        }

        console.log("[mgrepSearch] results", { results });

        return {
          success: true,
          query,
          results,
          maxCount: limit,
          showContent,
          generateAnswer,
          store: storeName,
        };
      } catch (error) {
        return {
          error: `Search failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
  });

  const mgrepStatusTool = tool({
    description: "Check mgrep status and available stores",
    inputSchema: z.object({
      store: z.string().optional().describe("Optional store name to check"),
    }),
    execute: async ({ store }: { store?: string }) => {
      try {
        const client = createMixedbreadClient(apiKey);
        const storeName = store || process.env.MXBAI_STORE || "mgrep";

        const info = await client.stores.retrieve(storeName);

        return {
          success: true,
          status: "mgrep store is accessible",
          store: storeName,
          info,
        };
      } catch (error) {
        return {
          error: `mgrep status check failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    },
  });

  return {
    mgrepSearchTool,
    mgrepStatusTool,
  };
};

export type mgrepSearchTool =
  ReturnType<typeof createMgrepTools>["mgrepSearchTool"];
export type mgrepStatusTool =
  ReturnType<typeof createMgrepTools>["mgrepStatusTool"];
