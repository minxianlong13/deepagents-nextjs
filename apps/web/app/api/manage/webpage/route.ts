import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
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
      const result = await connection.client.callTool({
        name: MCP_WEBPAGE_TOOL_NAME,
        arguments: { url: parsed.data.url },
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
          ? structuredContent.url
          : parsed.data.url;
      const title =
        typeof structuredContent?.title === "string" &&
        structuredContent.title.trim()
          ? structuredContent.title.trim()
          : new URL(finalUrl).hostname;
      const fileName = createMarkdownFileName(title, finalUrl);
      await mkdir(WEBPAGE_DIRECTORY, { recursive: true });
      await writeFile(
        path.join(WEBPAGE_DIRECTORY, fileName),
        `${markdown}\n`,
        "utf8",
      );

      return NextResponse.json({
        ok: true,
        url: finalUrl,
        title,
        filePath: `docs/webpage/${fileName}`,
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
