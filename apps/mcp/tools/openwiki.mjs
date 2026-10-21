import { isAbsolute } from "node:path";
import * as z from "zod/v4";
import { callOpenWikiTool } from "../lib/openwiki.mjs";

export function registerOpenWikiTools(server) {
  server.registerTool(
    "query_openwiki",
    {
      title: "Query OpenWiki",
      description:
        "Search an existing repository OpenWiki or read sections from its search results through the OpenWiki MCP server. Use action=search with query; use action=read with page, sections, and the result's wiki ID when present. The repository root must be accessible on this MCP server. No generation or model call is performed.",
      inputSchema: {
        action: z.enum(["search", "read"]),
        root: z
          .string()
          .min(1)
          .refine(isAbsolute, {
            message: "An absolute repository root path is required.",
          })
          .describe("Absolute Git repository root containing openwiki/."),
        query: z
          .string()
          .min(1)
          .max(2000)
          .optional()
          .describe("Required for search: repository question or concept."),
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
    async ({
      action,
      root,
      query,
      paths,
      limit,
      workspace,
      page,
      sections,
      wiki,
    }) => {
      if (action === "search") {
        if (!query?.trim()) {
          throw new Error("A query is required for OpenWiki search.");
        }
        return callOpenWikiTool("openwiki_search", {
          root,
          query,
          ...(paths !== undefined ? { paths } : {}),
          ...(limit !== undefined ? { limit } : {}),
          ...(workspace !== undefined ? { workspace } : {}),
        });
      }

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
