import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import * as nextEnvModule from "@next/env";
import { parse } from "dotenv";
import type { NextConfig } from "next";

// @next/env is bundled CommonJS. When Node loads this file as native ESM its
// exports only appear on `default`; when Next transpiles it to CommonJS they
// are on the module itself.
const nextEnv =
  (nextEnvModule as unknown as { default?: typeof nextEnvModule }).default ??
  nextEnvModule;

// Next.js only reads apps/web/.env. Add the variables from the repo-root .env
// (shared with apps/mcp) that are not already set, so apps/web/.env wins.
// They also go into Next's initial env snapshot: when an .env file changes in
// dev, Next resets process.env to that snapshot, which would drop them.
function loadRootEnv() {
  const rootEnvPath = path.resolve(process.cwd(), "../../.env");
  if (!existsSync(rootEnvPath)) return;

  const added: Record<string, string> = {};
  for (const [key, value] of Object.entries(parse(readFileSync(rootEnvPath)))) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
      added[key] = value;
    }
  }
  nextEnv.updateInitialEnv(added);
}

loadRootEnv();

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "deepagents",
    "@langchain/anthropic",
    "@langchain/openai",
    "langchain",
    "@modelcontextprotocol/sdk",
  ],
};

export default nextConfig;
