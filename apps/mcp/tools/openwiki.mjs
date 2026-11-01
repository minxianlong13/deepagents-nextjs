import * as z from "zod/v4";
import { callOpenWikiTool } from "../lib/openwiki.mjs";
import { resolveRepositoryRoot } from "../lib/repository-roots.mjs";

function retrievalData(result) {
  if (result.structuredContent) return result.structuredContent;
  const text = result.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  return JSON.parse(text || "{}");
}

export function registerOpenWikiTools(server) {
  server.registerTool(
    "query_openwiki",
    {
      title: "Query OpenWiki",
      description:
        "Search an existing repository or workspace OpenWiki and automatically read the matching sections for more detail. Returns search references, detailed reads, and any read errors. The repository root must be accessible on this MCP server. No generation or model call is performed.",
      inputSchema: {
        repo: z
          .string()
          .min(1)
          .max(100)
          .describe("Repository name from the MCP repository configuration."),
        query: z
          .string()
          .trim()
          .min(1)
          .max(2000)
          .describe("Repository question or concept to search and read about."),
        paths: z
          .array(z.string().min(1).max(500))
          .max(20)
          .optional()
          .describe(
            "Search only: repository-relative paths to boost related results.",
          ),
        limit: z.number().int().min(1).max(20).optional(),
        workspace: z
          .string()
          .min(1)
          .max(80)
          .optional()
          .describe("Search only: workspace ID or unique name."),
      },
    },
    async ({ repo, query, paths, limit, workspace }) => {
      const root = resolveRepositoryRoot(repo);
      const search = await callOpenWikiTool("openwiki_search", {
        root,
        query,
        ...(paths !== undefined ? { paths } : {}),
        ...(limit !== undefined ? { limit } : {}),
        ...(workspace !== undefined ? { workspace } : {}),
      });
      if (search.isError) return search;

      const data = retrievalData(search);
      const pages = new Map();
      for (const result of (data.results ?? []).slice(0, limit ?? 5)) {
        for (const reference of result.ref ?? []) {
          const separator = reference.indexOf("#");
          if (separator < 1 || separator === reference.length - 1) continue;
          const page = reference.slice(0, separator);
          const section = reference.slice(separator + 1);
          const key = JSON.stringify([result.wiki, page]);
          if (!pages.has(key)) {
            pages.set(key, { page, wiki: result.wiki, sections: new Set() });
          }
          pages.get(key).sections.add(section);
        }
      }

      const reads = [];
      const readErrors = [];
      for (const { page, wiki, sections } of pages.values()) {
        try {
          const read = await callOpenWikiTool("openwiki_read", {
            root,
            page,
            sections: [...sections],
            ...(wiki !== undefined ? { wiki } : {}),
          });
          if (read.isError) {
            readErrors.push({ page, wiki, ...read });
          } else {
            reads.push({ ...retrievalData(read), page, wiki });
          }
        } catch (error) {
          readErrors.push({
            page,
            wiki,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      const structuredContent = { ...data, reads, readErrors };
      return {
        content: [{ type: "text", text: JSON.stringify(structuredContent) }],
        structuredContent,
      };
    },
  );

  server.registerTool(
    "read_openwiki",
    {
      title: "Read OpenWiki",
      description:
        "Read exact OpenWiki section anchors from a search reference. Pass its wiki ID for a linked repository.",
      inputSchema: {
        repo: z.string().min(1).max(100),
        page: z
          .string()
          .min(1)
          .max(1000)
          .optional()
          .describe("Required for read: wiki page from a search reference."),
        sections: z
          .array(z.string().min(1).max(500))
          .min(1)
          .max(20)
          .optional()
          .describe(
            "Required for read: exact heading anchors from search references.",
          ),
        wiki: z
          .string()
          .min(1)
          .max(64)
          .optional()
          .describe(
            "Read only: linked wiki ID from the selected search result.",
          ),
      },
    },
    async ({ repo, page, sections, wiki }) => {
      const root = resolveRepositoryRoot(repo);
      if (!page?.trim() || !sections?.length) {
        throw new Error(
          "A page and section anchors are required for OpenWiki read.",
        );
      }
      return callOpenWikiTool("openwiki_read", {
        root,
        page,
        sections,
        ...(wiki !== undefined ? { wiki } : {}),
      });
    },
  );
}
