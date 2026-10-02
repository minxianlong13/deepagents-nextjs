import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod/v4";

const DEFAULT_WIKI_BASE_URL = "https://wiki.cvent.com";

function getWikiAuthHeaders() {
  const authType = (process.env.WIKI_AUTH_TYPE ?? "bearer").toLowerCase();

  if (authType === "bearer") {
    const token = process.env.WIKI_BEARER_TOKEN;
    if (!token) {
      throw new Error("WIKI_BEARER_TOKEN is not configured");
    }

    return { Authorization: `Bearer ${token}` };
  }

  if (authType === "basic") {
    const username = process.env.WIKI_USERNAME;
    const password = process.env.WIKI_PASSWORD;
    if (!username || !password) {
      throw new Error(
        "WIKI_USERNAME and WIKI_PASSWORD are required when WIKI_AUTH_TYPE=basic",
      );
    }

    const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${encodedCredentials}` };
  }

  throw new Error(
    `Unsupported WIKI_AUTH_TYPE '${authType}'. Use 'bearer' or 'basic'.`,
  );
}

async function fetchWikiJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...getWikiAuthHeaders(),
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Wiki request failed (${response.status}) for ${url.pathname}: ${
        responseText || response.statusText
      }`,
    );
  }

  return response.json();
}

async function getWikiChildPageIds(wikiBaseUrl, parentContentId) {
  const childPageIds = [];
  let start = 0;

  while (true) {
    const childrenUrl = new URL(
      `/rest/api/content/${encodeURIComponent(parentContentId)}/child/page`,
      `${wikiBaseUrl}/`,
    );
    childrenUrl.searchParams.set("limit", "100");
    childrenUrl.searchParams.set("start", String(start));

    const children = await fetchWikiJson(childrenUrl);
    const results = Array.isArray(children.results) ? children.results : [];
    childPageIds.push(
      ...results
        .map((page) => page?.id)
        .filter((id) => typeof id === "string" && /^\d+$/.test(id)),
    );

    const nextPage = children._links?.next;
    if (nextPage) {
      const nextUrl = new URL(nextPage, `${wikiBaseUrl}/`);
      start = Number.parseInt(nextUrl.searchParams.get("start") ?? "0", 10);
      if (!Number.isFinite(start)) {
        break;
      }
      continue;
    }

    if (results.length < 100) {
      break;
    }
    start += results.length;
  }

  return [...new Set(childPageIds)];
}

async function getWikiDescendantPageIds(wikiBaseUrl, parentContentId) {
  const descendantPageIds = [];
  const visitedPageIds = new Set([parentContentId]);
  const pagesToVisit = [parentContentId];
  let nextPageIndex = 0;

  while (nextPageIndex < pagesToVisit.length) {
    const currentPageId = pagesToVisit[nextPageIndex];
    nextPageIndex += 1;
    const childPageIds = await getWikiChildPageIds(
      wikiBaseUrl,
      currentPageId,
    );

    for (const childPageId of childPageIds) {
      if (visitedPageIds.has(childPageId)) {
        continue;
      }

      visitedPageIds.add(childPageId);
      descendantPageIds.push(childPageId);
      pagesToVisit.push(childPageId);
    }
  }

  return descendantPageIds;
}

function getWikiContentUrl(wikiBaseUrl, contentId) {
  const contentUrl = new URL(
    `/rest/api/content/${encodeURIComponent(contentId)}`,
    `${wikiBaseUrl}/`,
  );
  contentUrl.searchParams.set("expand", "body.storage,version,space,ancestors");
  return contentUrl;
}

async function fetchWikiPage(wikiBaseUrl, contentId) {
  const wikiContent = await fetchWikiJson(
    getWikiContentUrl(wikiBaseUrl, contentId),
  );
  const content = wikiContent.body?.storage?.value;
  if (typeof content !== "string") {
    throw new Error(
      `Wiki response for content ${contentId} did not contain body.storage.value`,
    );
  }

  return {
    contentId,
    title: wikiContent.title ?? contentId,
    content,
  };
}

export function registerWikiTools(server) {
  server.registerTool(
    "get_wiki_content",
    {
      title: "Get Wiki Content",
      description:
        "Fetch a Confluence page and all of its descendant pages by parent ID, retrieve their storage content, and export each page to a Markdown file.",
      inputSchema: {
        contentId: z
          .string()
          .regex(/^\d+$/)
          .describe("Confluence content ID, for example 65655871"),
      },
    },
    async ({ contentId }) => {
      const wikiBaseUrl = (
        process.env.WIKI_BASE_URL ?? DEFAULT_WIKI_BASE_URL
      ).replace(/\/$/, "");
      const parentPage = await fetchWikiPage(wikiBaseUrl, contentId);
      const descendantPageIds = await getWikiDescendantPageIds(
        wikiBaseUrl,
        contentId,
      );
      const childPages = await Promise.all(
        descendantPageIds.map(async (descendantPageId) => {
          return fetchWikiPage(wikiBaseUrl, descendantPageId);
        }),
      );
      const pages = [parentPage, ...childPages];

      const outputDirectory = process.env.WIKI_OUTPUT_DIR ?? process.cwd();
      await mkdir(outputDirectory, { recursive: true });
      const files = await Promise.all(
        pages.map(async (page) => {
          const outputPath = join(outputDirectory, `wiki-${page.contentId}.md`);
          await writeFile(outputPath, page.content, "utf8");
          return {
            contentId: page.contentId,
            title: page.title,
            filePath: outputPath,
          };
        }),
      );
      const combinedContent = pages
        .map(
          (page) =>
            `<!-- ${page.title} (${page.contentId}) -->\n${page.content}`,
        )
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: combinedContent,
          },
        ],
        structuredContent: {
          parentContentId: contentId,
          childPageIds: descendantPageIds,
          files,
        },
      };
    },
  );
}
