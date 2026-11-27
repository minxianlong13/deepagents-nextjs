// Loads apps/mcp/.env, then the repo-root .env for variables shared with
// apps/web. A variable that is already set is never overwritten, so the shell
// (or Cloud Run) wins over apps/mcp/.env, which wins over the root .env.
// Paths come from this file's location, so it works from any working
// directory. Missing files are skipped, as in the Docker image.

import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const appEnvPath = fileURLToPath(new URL("../.env", import.meta.url));
const rootEnvPath = fileURLToPath(new URL("../../../.env", import.meta.url));

config({ path: [appEnvPath, rootEnvPath], quiet: true });
