import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const OAUTH_CALLBACK_PATH = "/slack/oauth/callback";
let oauthProvider;
let pendingAuthorization;
let upstreamConnectionQueue = Promise.resolve();

function openAuthorizationUrl(url) {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "cmd"
        : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const browser = spawn(command, args, { detached: true, stdio: "ignore" });
  browser.on("error", () => {
    console.error(
      `Open this URL to authorize the Slack MCP connection: ${url}`,
    );
  });
  browser.unref();
}

function getOAuthProvider(redirectUrl) {
  if (oauthProvider) {
    return oauthProvider;
  }

  const clientMetadata = {
    client_name: "DeepAgents Local Slack MCP Proxy",
    redirect_uris: [redirectUrl],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
  };

  oauthProvider = {
    redirectUrl,
    clientInfo: undefined,
    savedTokens: undefined,
    savedCodeVerifier: undefined,
    get clientMetadata() {
      return clientMetadata;
    },
    state() {
      return randomBytes(32).toString("hex");
    },
    clientInformation() {
      return this.clientInfo;
    },
    saveClientInformation(clientInfo) {
      this.clientInfo = clientInfo;
    },
    tokens() {
      return this.savedTokens;
    },
    saveTokens(tokens) {
      this.savedTokens = tokens;
    },
    saveCodeVerifier(codeVerifier) {
      this.savedCodeVerifier = codeVerifier;
    },
    codeVerifier() {
      if (!this.savedCodeVerifier) {
        throw new Error("No Slack MCP OAuth PKCE verifier is available");
      }
      return this.savedCodeVerifier;
    },
    redirectToAuthorization(authorizationUrl) {
      let resolveCode;
      let rejectCode;
      const codePromise = new Promise((resolve, reject) => {
        resolveCode = resolve;
        rejectCode = reject;
      });
      const timeout = setTimeout(
        () => {
          pendingAuthorization = undefined;
          rejectCode(new Error("Slack MCP OAuth authorization timed out"));
        },
        5 * 60 * 1000,
      );
      timeout.unref();

      pendingAuthorization = {
        state: authorizationUrl.searchParams.get("state"),
        codePromise,
        resolveCode: (code) => {
          clearTimeout(timeout);
          resolveCode(code);
        },
        rejectCode: (error) => {
          clearTimeout(timeout);
          rejectCode(error);
        },
      };
      openAuthorizationUrl(authorizationUrl.toString());
    },
  };

  return oauthProvider;
}

export function registerSlackOAuthCallback(app) {
  app.get(OAUTH_CALLBACK_PATH, (req, res) => {
    const state = typeof req.query.state === "string" ? req.query.state : "";
    const code = typeof req.query.code === "string" ? req.query.code : "";
    const oauthError =
      typeof req.query.error === "string" ? req.query.error : undefined;

    if (!pendingAuthorization || state !== pendingAuthorization.state) {
      res.status(400).send("Invalid or expired Slack MCP OAuth state.");
      return;
    }

    const authorization = pendingAuthorization;
    pendingAuthorization = undefined;
    if (oauthError) {
      authorization.rejectCode(
        new Error(`Slack MCP OAuth authorization failed: ${oauthError}`),
      );
      res.status(400).send("Slack MCP authorization was not completed.");
      return;
    }

    if (!code) {
      authorization.rejectCode(
        new Error("Slack MCP OAuth callback did not include a code"),
      );
      res.status(400).send("Slack MCP OAuth callback did not include a code.");
      return;
    }

    authorization.resolveCode(code);
    res
      .status(200)
      .type("html")
      .send(
        "<p>Slack MCP authorization received. You can close this window.</p>",
      );
  });
}

function getHeaderValue(block, expression) {
  return block.match(expression)?.[1]?.trim() ?? null;
}

function getTextSection(block, sectionName, followingSections) {
  const start = new RegExp(`^${sectionName}:\\s*\\n`, "m").exec(block);
  if (!start) {
    return null;
  }

  const contentStart = start.index + start[0].length;
  const stopAlternatives = ["---\\s*(?:\\n|$)"];
  if (followingSections.length) {
    stopAlternatives.unshift(`(?:${followingSections.join("|")})(?::|\\s*$)`);
  }
  const stopPattern = new RegExp(`\\n(?:${stopAlternatives.join("|")})`, "gm");
  stopPattern.lastIndex = contentStart;
  const stop = stopPattern.exec(block);
  return block.slice(contentStart, stop?.index ?? block.length).trimEnd();
}

function parseSlackMessageBlock(block, rank) {
  const channel = getHeaderValue(
    block,
    /^Channel:\s*(.*?)\s*\(ID:\s*([^)]+)\)/m,
  );
  const channelMatch = block.match(/^Channel:\s*(.*?)\s*\(ID:\s*([^)]+)\)/m);
  const authorMatch = block.match(/^From:\s*(.*?)\s*\(ID:\s*([^)]+)\)/m);
  const authorLabel = authorMatch?.[1]?.trim() ?? "";
  const authorName = authorLabel.replace(/\s*<[^>]*>\s*$/, "").trim();
  const bot = /^From:.*\[BOT\]/m.test(block);
  const permalink = block.match(/^Permalink:\s*\[link\]\(([^)]+)\)/m)?.[1];
  const replyCount = getHeaderValue(block, /^Reply count:\s*(\d+)/m);

  return {
    rank,
    channel: channelMatch
      ? { name: channel ?? channelMatch[1].trim(), id: channelMatch[2].trim() }
      : null,
    author: {
      name: authorName || (bot ? "Slack Bot" : "Unknown"),
      id: authorMatch?.[2]?.trim() ?? null,
      isBot: bot,
    },
    time: getHeaderValue(block, /^Time:\s*(.+)$/m),
    messageTs: getHeaderValue(block, /^Message_ts:\s*(.+)$/m),
    permalink: permalink ?? null,
    replyCount: replyCount === null ? null : Number(replyCount),
    text: getTextSection(block, "Text", ["Context before", "Context after"]),
    contextBefore: getTextSection(block, "Context before", ["Context after"]),
    contextAfter: getTextSection(block, "Context after", []),
  };
}

function parseSlackResults(rawResults) {
  if (typeof rawResults !== "string") {
    return { total: null, messages: [] };
  }

  const resultHeaders = [
    ...rawResults.matchAll(/^### Result (\d+) of (\d+)$/gm),
  ];
  let messages = resultHeaders.map((header, index) => {
    const blockStart = header.index + header[0].length;
    const blockEnd = resultHeaders[index + 1]?.index ?? rawResults.length;
    return parseSlackMessageBlock(
      rawResults.slice(blockStart, blockEnd).replace(/\n---\s*$/, ""),
      Number(header[1]),
    );
  });

  if (messages.length === 0) {
    const conciseRows = [];
    let currentRow;

    for (const line of rawResults.split(/\r?\n/)) {
      const rowMatch = /^\s*(\d+)\.\s+(.+?)\s+-\s+([^:\n]+):(?:\s+(.*))?$/.exec(
        line,
      );
      if (rowMatch) {
        currentRow = {
          rank: Number(rowMatch[1]),
          channel: rowMatch[2].trim(),
          author: rowMatch[3].trim(),
          text: rowMatch[4] ?? "",
        };
        conciseRows.push(currentRow);
      } else if (currentRow && !/^\s*---\s*$/.test(line)) {
        currentRow.text += `\n${line}`;
      }
    }

    messages = conciseRows.map((row) => {
      const timeMatch = row.text.match(
        /\s+(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [A-Z]{2,5})$/,
      );
      const permalink = row.text.match(
        /<(https?:\/\/[^|>]+)(?:\|[^>]*)?>/,
      )?.[1];
      const text = timeMatch
        ? row.text.slice(0, timeMatch.index).trimEnd()
        : row.text;

      return {
        rank: row.rank,
        channel: {
          name: row.channel.replace(/^#/, ""),
          id: null,
        },
        author: {
          name: row.author,
          id: null,
          isBot: false,
        },
        time: timeMatch?.[1] ?? null,
        messageTs: null,
        permalink: permalink ?? null,
        replyCount: null,
        text,
        contextBefore: null,
        contextAfter: null,
      };
    });
  }

  const resultCount = rawResults.match(/^## Messages \((\d+) results?\)/m)?.[1];
  const headingTotal = resultHeaders[0]?.[2];

  return {
    total: resultCount
      ? Number(resultCount)
      : headingTotal
        ? Number(headingTotal)
        : null,
    messages,
  };
}

function unwrapSlackPayload(value) {
  let current = value;

  for (let depth = 0; depth < 32; depth += 1) {
    if (Array.isArray(current)) {
      const textBlock = current.find(
        (item) => item && typeof item === "object" && item.type === "text",
      );
      current = textBlock ? textBlock.text : current[0];
      continue;
    }

    if (typeof current === "string") {
      try {
        current = JSON.parse(current);
        continue;
      } catch {
        return { payload: null, rawText: current };
      }
    }

    if (!current || typeof current !== "object") {
      return { payload: null, rawText: "" };
    }

    if (current.structuredContent) {
      current = current.structuredContent;
      continue;
    }

    if (Array.isArray(current.content)) {
      current = current.content;
      continue;
    }

    return { payload: current, rawText: "" };
  }

  return {
    payload: current && typeof current === "object" ? current : null,
    rawText: typeof current === "string" ? current : "",
  };
}

export function normalizeSlackSearchResult(result, input) {
  const { payload, rawText } = unwrapSlackPayload(result);

  const rawResults =
    typeof payload?.results === "string"
      ? payload.results
      : typeof payload?.results === "object" && payload.results !== null
        ? JSON.stringify(payload.results)
        : rawText;
  const parsedSearch = parseSlackResults(rawResults);
  const cursorMatch = payload?.pagination_info?.match(/cursor `([^`]+)`/);

  return {
    schema: "slack-search/v1",
    query: {
      query: input.query ?? null,
      keywords: input.keywords ?? [],
      filters: input.filters ?? null,
      naturalLanguage: input.natural_language_query ?? null,
    },
    total: parsedSearch.total,
    results: parsedSearch.messages,
    pagination: {
      info: payload?.pagination_info ?? null,
      nextCursor: cursorMatch?.[1] ?? null,
    },
    ...(parsedSearch.messages.length ? {} : { rawResults }),
  };
}

async function connectToSlackMcpUnlocked(url, redirectUrl) {
  const provider = getOAuthProvider(redirectUrl);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const client = new Client({
      name: "deepagents-slack-proxy",
      version: "0.1.0",
    });
    const transport = new StreamableHTTPClientTransport(new URL(url), {
      authProvider: provider,
    });

    try {
      await client.connect(transport);
      return { client, transport };
    } catch (error) {
      if (error instanceof UnauthorizedError && attempt === 0) {
        const authorization = pendingAuthorization;
        if (!authorization) {
          await client.close().catch(() => {});
          await transport.close().catch(() => {});
          throw new Error(
            "Slack MCP requires OAuth but did not start an authorization redirect",
          );
        }

        try {
          const authorizationCode = await authorization.codePromise;
          await transport.finishAuth(authorizationCode);
        } catch (authError) {
          await client.close().catch(() => {});
          await transport.close().catch(() => {});
          throw authError;
        }

        await client.close().catch(() => {});
        await transport.close().catch(() => {});
        continue;
      }

      await client.close().catch(() => {});
      await transport.close().catch(() => {});
      throw error;
    }
  }

  throw new Error("Could not connect to the Slack MCP server after OAuth");
}

export async function connectToSlackMcp(url, redirectUrl) {
  const previousConnection = upstreamConnectionQueue;
  let releaseConnection;
  upstreamConnectionQueue = new Promise((resolve) => {
    releaseConnection = resolve;
  });
  await previousConnection;

  try {
    return await connectToSlackMcpUnlocked(url, redirectUrl);
  } finally {
    releaseConnection();
  }
}
