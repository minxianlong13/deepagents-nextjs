import * as z from "zod/v4";
import { extractWebpageContent, renderWebpage } from "../lib/webpage.mjs";

export function registerWebpageTools(server) {
  server.registerTool(
    "ingest_webpage",
    {
      title: "Ingest Webpage",
      description:
        "Render a public webpage, extract its main article content, and return it as Markdown.",
      inputSchema: {
        url: z.url().describe("Public HTTP or HTTPS webpage URL to ingest."),
      },
    },
    async ({ url }) => {
      const webpage = await renderWebpage(url);
      const { title, markdown } = extractWebpageContent(
        webpage.html,
        webpage.url,
      );
      const structuredContent = {
        url: webpage.url,
        title,
        markdown,
      };

      return {
        content: [{ type: "text", text: markdown }],
        structuredContent,
      };
    },
  );
}
