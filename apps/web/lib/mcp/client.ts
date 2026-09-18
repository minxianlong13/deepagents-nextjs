import { readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

type McpServerConfig = {
  type?: "http";
  url: string;
  headers?: Record<string, string>;
};

type McpConfig = {
  servers?: Record<string, McpServerConfig>;
  mcpServers?: Record<string, McpServerConfig>;
};

export type McpServerInfo = {
  name: string;
  url: string;
  server?: ReturnType<Client["getServerVersion"]>;
  capabilities?: ReturnType<Client["getServerCapabilities"]>;
  instructions?: string;
  tools: Awaited<ReturnType<Client["listTools"]>>["tools"];
  resources: Awaited<ReturnType<Client["listResources"]>>["resources"];
  prompts: Awaited<ReturnType<Client["listPrompts"]>>["prompts"];
};

export type McpConnection = {
  client: Client;
  serverName: string;
  server: McpServerConfig;
  close: () => Promise<void>;
};

function getConfigPaths() {
  return [
    process.env.MCP_CONFIG_PATH,
    path.resolve(process.cwd(), ".vscode/mcp.json"),
    path.resolve(process.cwd(), "../../.vscode/mcp.json"),
  ].filter((value): value is string => Boolean(value));
}

async function readMcpConfig(): Promise<McpConfig> {
  let lastError: unknown;

  for (const configPath of getConfigPaths()) {
    try {
      return JSON.parse(await readFile(configPath, "utf8")) as McpConfig;
    } catch (error: unknown) {
      lastError = error;
    }
  }

  const message =
    lastError instanceof Error ? lastError.message : "MCP config was not found";
  throw new Error(`Unable to read mcp.json. ${message}`);
}

async function getConfiguredServers() {
  const config = await readMcpConfig();
  const servers = config.servers ?? config.mcpServers;

  if (!servers || Object.keys(servers).length === 0) {
    throw new Error("mcp.json does not contain any configured MCP servers");
  }

  return servers;
}

export async function loadMcpClientConfig() {
  const servers = await getConfiguredServers();

  return {
    mcpServers: Object.fromEntries(
      Object.entries(servers).map(([name, server]) => [
        name,
        {
          transport: server.type ?? "http",
          url: server.url,
          headers: server.headers,
        },
      ]),
    ),
    throwOnLoadError: true,
    prefixToolNameWithServerName: false,
  };
}

export async function listConfiguredMcpServers() {
  const servers = await getConfiguredServers();
  return Object.entries(servers).map(([name, server]) => ({
    name,
    ...server,
  }));
}

export async function createMcpClient(
  serverName = process.env.MCP_SERVER_NAME,
): Promise<McpConnection> {
  const servers = await getConfiguredServers();
  const selectedName = serverName ?? Object.keys(servers)[0];
  const server = servers[selectedName];

  if (!server) {
    throw new Error(
      `MCP server '${selectedName}' was not found in the configured servers`,
    );
  }

  if (server.type && server.type !== "http") {
    throw new Error(
      `MCP server '${selectedName}' uses unsupported transport '${server.type}'. Only type 'http' is supported.`,
    );
  }

  const headers = server.headers
    ? Object.fromEntries(
        Object.entries(server.headers).map(([key, value]) => [key, value]),
      )
    : undefined;
  const transport = new StreamableHTTPClientTransport(new URL(server.url), {
    requestInit: headers ? { headers } : undefined,
  });
  const client = new Client({
    name: "deepagents-mcp-client",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }

  return {
    client,
    serverName: selectedName,
    server,
    close: () => client.close(),
  };
}

export async function listMcpServerInfo(serverName?: string) {
  const connection = await createMcpClient(serverName);
  const { client, server, close } = connection;

  try {
    const capabilities = client.getServerCapabilities();
    const [tools, resources, prompts] = await Promise.all([
      client.listTools(),
      capabilities?.resources ? client.listResources() : { resources: [] },
      capabilities?.prompts ? client.listPrompts() : { prompts: [] },
    ]);

    return {
      name: connection.serverName,
      url: server.url,
      server: client.getServerVersion(),
      capabilities,
      instructions: client.getInstructions(),
      tools: tools.tools,
      resources: resources.resources,
      prompts: prompts.prompts,
    } satisfies McpServerInfo;
  } finally {
    await close();
  }
}
