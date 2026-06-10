import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["@langchain/openai", "langchain"],
};

export default nextConfig;
