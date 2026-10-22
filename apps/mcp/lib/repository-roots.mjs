import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const configDirectory = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../config",
);
const repositoryConfigPath = resolve(configDirectory, "repositories.json");

export function resolveRepositoryRoot(repo) {
  const repositories = JSON.parse(readFileSync(repositoryConfigPath, "utf8"));
  const configuredPath = repositories[repo];

  if (typeof configuredPath !== "string" || configuredPath.length === 0) {
    throw new Error(
      `Repository '${repo}' is not configured in repositories.json.`,
    );
  }

  const root = resolve(configDirectory, configuredPath);
  if (!statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    throw new Error(
      `Configured root for repository '${repo}' is not a directory.`,
    );
  }
  if (!existsSync(resolve(root, "openwiki"))) {
    throw new Error(
      `Configured root for repository '${repo}' does not contain openwiki/.`,
    );
  }

  return root;
}
