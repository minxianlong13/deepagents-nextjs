// Loads apps/web/.env, then the repo-root .env for variables shared with
// apps/mcp. A variable that is already set is never overwritten, so the
// shell wins over apps/web/.env, which wins over the root .env.
//
// Import this for its side effect in code that runs outside `next`
// (tsx scripts, prisma.config.ts). next.config.ts loads the root .env itself.
//
// Paths are relative to the working directory, which is apps/web for
// `pnpm dev`, `pnpm index:kb` and prisma commands.

import path from "node:path";
import { config } from "dotenv";

export const APP_ENV_PATH = path.resolve(process.cwd(), ".env");
export const ROOT_ENV_PATH = path.resolve(process.cwd(), "../../.env");

config({ path: [APP_ENV_PATH, ROOT_ENV_PATH], quiet: true });
