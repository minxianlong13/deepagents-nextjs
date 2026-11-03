import { createHash } from "node:crypto";
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { createMcpClient } from "@/lib/mcp/client";

export const runtime = "nodejs";
export const maxDuration = 300;

const payloadSchema = z.object({
  url: z.url().refine((value) => {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  }),
});

const MCP_WEBPAGE_TOOL_NAME = "ingest_webpage";
const WEBPAGE_DIRECTORY = path.resolve(process.cwd(), "../../docs/webpage");
const MAX_RELATED_WEBPAGES = 20;
const CVENT_COMMUNITY_ARTICLE_PATH = /(?:^|\/)s\/communityarticle(?:\/|$)/i;

function isTextContent(item: unknown): item is { type: "text"; text: string } {
  return (
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    item.type === "text" &&
    "text" in item &&
    typeof item.text === "string"
  );
}

function createMarkdownFileName(title: string, url: string) {
  const titleSlug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const urlHash = createHash("sha256").update(url).digest("hex").slice(0, 12);

  return `${titleSlug || "webpage"}-${urlHash}.md`;
}

function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  return url.toString();
}

function isCventCommunityArticleUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.toLowerCase() === "support.cvent.com" &&
      CVENT_COMMUNITY_ARTICLE_PATH.test(url.pathname)
    );
  } catch {
    return false;
  }
}

function extractCventCommunityArticleLinks(markdown: string, baseUrl: string) {
  const links = new Set<string>();
  const markdownLinkPattern = /\[[^\]]*\]\((https?:\/\/[^\s)]+)(?:\s+[^)]*)?\)/gi;

  for (const match of markdown.matchAll(markdownLinkPattern)) {
    const rawUrl = match[1];
    if (!rawUrl) continue;

    try {
      const absoluteUrl = new URL(rawUrl, baseUrl).toString();
      if (isCventCommunityArticleUrl(absoluteUrl)) {
        links.add(normalizeUrl(absoluteUrl));
      }
    } catch {
      // Ignore malformed links in extracted article content.
    }
  }

  return [...links];
}

async function getExistingWebpageHashes() {
  const files = await readdir(WEBPAGE_DIRECTORY).catch(() => []);
  return new Map(
    files
      .filter((fileName) => fileName.endsWith(".md"))
      .map((fileName) => [
        fileName.match(/-([a-f0-9]{12})\.md$/i)?.[1],
        fileName,
      ] as const)
      .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
  );
}

type IngestedWebpage = {
  url: string;
  title: string;
  filePath: string;
  markdown: string;
  relatedUrls: string[];
  skipped: boolean;
};

async function ingestWebpage(
  connection: Awaited<ReturnType<typeof createMcpClient>>,
  url: string,
  existingFilesByHash: Map<string, string>,
  visitedUrls: Set<string>,
  overwriteExisting: boolean,
): Promise<IngestedWebpage> {
  const normalizedUrl = normalizeUrl(url);
  const urlHash = createHash("sha256")
    .update(normalizedUrl)
    .digest("hex")
    .slice(0, 12);
  const existingFileName = existingFilesByHash.get(urlHash);

  if (existingFileName && !overwriteExisting) {
    visitedUrls.add(normalizedUrl);
    return {
      url: normalizedUrl,
      title: "Existing webpage",
      filePath: `docs/webpage/${existingFileName}`,
      markdown: "",
      relatedUrls: [],
      skipped: true,
    };
  }

  const result = await connection.client.callTool({
    name: MCP_WEBPAGE_TOOL_NAME,
    arguments: { url: normalizedUrl },
  });

  if (result.isError) {
    const errorContent = Array.isArray(result.content)
      ? result.content.filter(isTextContent).map((item) => item.text)
      : [];
    throw new Error(errorContent.join("\n") || "Webpage ingestion failed.");
  }

  const structuredContent = result.structuredContent as
    | { url?: unknown; title?: unknown; markdown?: unknown }
    | undefined;
  const markdownFromContent = (
    Array.isArray(result.content)
      ? result.content.filter(isTextContent).map((item) => item.text)
      : []
  )
    .join("\n")
    .trim();
  const markdown =
    typeof structuredContent?.markdown === "string"
      ? structuredContent.markdown.trim()
      : markdownFromContent;

  if (!markdown) {
    throw new Error("The webpage MCP tool returned no Markdown content.");
  }

  const finalUrl =
    typeof structuredContent?.url === "string"
      ? normalizeUrl(structuredContent.url)
      : normalizedUrl;
  const title =
    typeof structuredContent?.title === "string" &&
    structuredContent.title.trim()
      ? structuredContent.title.trim()
      : new URL(finalUrl).hostname;
  const fileName = createMarkdownFileName(title, finalUrl);

  await mkdir(WEBPAGE_DIRECTORY, { recursive: true });
  await writeFile(
    path.join(WEBPAGE_DIRECTORY, fileName),
    `<!-- source-url: ${finalUrl} -->\n\n${markdown}\n`,
    "utf8",
  );
  existingFilesByHash.set(
    createHash("sha256").update(finalUrl).digest("hex").slice(0, 12),
    fileName,
  );
  visitedUrls.add(normalizedUrl);
  visitedUrls.add(finalUrl);

  return {
    url: finalUrl,
    title,
    filePath: `docs/webpage/${fileName}`,
    markdown,
    relatedUrls: extractCventCommunityArticleLinks(markdown, finalUrl),
    skipped: false,
  };
}

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);

  if (rawBody === null) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid HTTP or HTTPS webpage URL is required." },
      { status: 400 },
    );
  }

  try {
    const connection = await createMcpClient();

    try {
      const existingFilesByHash = await getExistingWebpageHashes();
      const visitedUrls = new Set<string>();
      const queue = [normalizeUrl(parsed.data.url)];
      const savedPages: Array<{
        url: string;
        title: string;
        filePath: string;
        skipped: boolean;
      }> = [];
      const failedRelatedPages: Array<{ url: string; error: string }> = [];

      let primaryPage: IngestedWebpage | undefined;
      while (queue.length > 0 && savedPages.length < MAX_RELATED_WEBPAGES + 1) {
        const url = queue.shift();
        if (!url || visitedUrls.has(url)) continue;
        visitedUrls.add(url);

        try {
          const page = await ingestWebpage(
            connection,
            url,
            existingFilesByHash,
            visitedUrls,
            savedPages.length === 0,
          );
          if (!primaryPage) primaryPage = page;
          savedPages.push({
            url: page.url,
            title: page.title,
            filePath: page.filePath,
            skipped: page.skipped,
          });

          if (!page.skipped) {
            for (const relatedUrl of page.relatedUrls) {
              if (
                !visitedUrls.has(relatedUrl) &&
                !queue.includes(relatedUrl) &&
                queue.length + savedPages.length < MAX_RELATED_WEBPAGES + 1
              ) {
                queue.push(relatedUrl);
              }
            }
          }
        } catch (error: unknown) {
          if (!primaryPage) throw error;
          failedRelatedPages.push({
            url,
            error: error instanceof Error ? error.message : "Ingestion failed.",
          });
        }
      }

      if (!primaryPage) {
        throw new Error("The primary webpage could not be ingested.");
      }

      return NextResponse.json({
        ok: true,
        url: primaryPage.url,
        title: primaryPage.title,
        filePath: primaryPage.filePath,
        pages: savedPages,
        downloadedCount: savedPages.filter((page) => !page.skipped).length,
        skippedCount: savedPages.filter((page) => page.skipped).length,
        failedRelatedPages,
        truncated: queue.length > 0,
      });
    } finally {
      await connection.close();
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to ingest webpage";

    return NextResponse.json(
      {
        error: "Failed to retrieve webpage content from the MCP server.",
        details: message,
      },
      { status: 500 },
    );
  }
}
