import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "deepagents",
    "@langchain/openai",
    "langchain",
    "@modelcontextprotocol/sdk",
  ],
};

export default nextConfig;
