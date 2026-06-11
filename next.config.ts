import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "@langchain/openai",
    "langchain",
    "@modelcontextprotocol/sdk",
  ],
};

export default nextConfig;
