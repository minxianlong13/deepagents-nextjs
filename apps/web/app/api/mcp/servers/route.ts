import {
  listConfiguredMcpServers,
  listMcpServerInfo,
} from "@/lib/mcp/client";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const serverName = new URL(req.url).searchParams.get("name") ?? undefined;
    const configuredServers = await listConfiguredMcpServers();
    const selectedServers = serverName
      ? configuredServers.filter((server) => server.name === serverName)
      : configuredServers;

    if (selectedServers.length === 0) {
      return NextResponse.json(
        { error: `MCP server '${serverName}' was not found` },
        { status: 404 },
      );
    }

    const servers = await Promise.all(
      selectedServers.map((server) => listMcpServerInfo(server.name)),
    );

    return NextResponse.json({ servers });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to inspect MCP servers",
      },
      { status: 500 },
    );
  }
}
