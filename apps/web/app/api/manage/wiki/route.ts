import { createMcpClient } from "@/lib/mcp/client";
import { NextResponse } from "next/server";
import * as z from "zod/v4";

export const runtime = "nodejs";
export const maxDuration = 300;

const payloadSchema = z.object({
  contentId: z.string().trim().regex(/^\d+$/),
});

const MCP_WIKI_TOOL_NAME = "get_wiki_content";

type WikiFile = {
  contentId: string;
  title: string;
  filePath: string;
};

export async function POST(request: Request) {
  const rawBody = await request.json().catch(() => null);

  if (rawBody === null) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "A numeric wiki parent ID is required.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const connection = await createMcpClient();

    try {
      const wikiResult = await connection.client.callTool({
        name: MCP_WIKI_TOOL_NAME,
        arguments: { contentId: parsed.data.contentId },
      });

      const textItems = Array.isArray(wikiResult.content)
        ? wikiResult.content.filter(
            (item: unknown): item is { type: "text"; text: string } =>
              typeof item === "object" &&
              item !== null &&
              "type" in item &&
              item.type === "text" &&
              "text" in item &&
              typeof item.text === "string",
          )
        : [];
      const content = textItems
        .map((item) => item.text)
        .join("\n\n");

      const structuredContent = wikiResult.structuredContent as
        | {
            parentContentId?: string;
            childPageIds?: string[];
            files?: WikiFile[];
          }
        | undefined;

      return NextResponse.json({
        input: { contentId: parsed.data.contentId },
        serverName: connection.serverName,
        parentContentId:
          structuredContent?.parentContentId ?? parsed.data.contentId,
        childPageIds: structuredContent?.childPageIds ?? [],
        files: structuredContent?.files ?? [],
        content,
      });
    } finally {
      await connection.close();
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to retrieve wiki content";

    return NextResponse.json(
      {
        error: "Failed to retrieve wiki content from the MCP server.",
        details: message,
      },
      { status: 500 },
    );
  }
}
