import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkDocument, sourceLabel } from "./markdown_chunker";

test("single H1 becomes the title and is not repeated in the path", async () => {
  const content = [
    "# Enabling Access Codes",
    "",
    "Intro paragraph. ".repeat(30),
    "",
    "## Steps",
    "",
    "Step text. ".repeat(40),
  ].join("\n");

  const chunks = await chunkDocument("local:webpage/enabling-access-codes-76262e14d2de.md", content);

  assert.equal(chunks.length, 2);
  assert.equal(chunks[0].title, "Enabling Access Codes");
  assert.equal(chunks[0].section, undefined);
  assert.equal(chunks[1].section, "Steps");
  assert.match(chunks[1].text, /^Title: Enabling Access Codes\nSource: webpage\/enabling-access-codes-76262e14d2de\.md\nSection: Steps\n\n## Steps/);
  assert.doesNotMatch(chunks[0].text, /^# Enabling/m);
});

test("several H1s are sections and the title falls back to the source label", async () => {
  const content = [
    "# 1\\. Purpose",
    "Purpose text. ".repeat(40),
    "# 6\\. Linkage as a two-record model",
    "## Rollback",
    "Rollback text. ".repeat(40),
  ].join("\n");

  const chunks = await chunkDocument("local:wiki/Passkey/wiki-1191973962.md", content);

  assert.equal(chunks[0].title, "Passkey: wiki 1191973962");
  assert.equal(chunks[0].section, "1. Purpose");
  assert.equal(chunks.at(-1)?.section, "6. Linkage as a two-record model > Rollback");
});

test("frontmatter is stripped and project name is added to the title", async () => {
  const content = [
    "---",
    "project_name: Passkey Event Housing Service",
    "document_type: adr",
    "---",
    "# ADR-001: Manual wiring, no DI",
    "Decision text. ".repeat(20),
  ].join("\n");

  const [chunk] = await chunkDocument("local:Passkey/project-knowledge/passkey-event-housing/adr/001.md", content);

  assert.equal(chunk.title, "ADR-001: Manual wiring, no DI (Passkey Event Housing Service)");
  assert.doesNotMatch(chunk.text, /document_type/);
});

test("headings inside code fences are not treated as sections", async () => {
  const content = ["# Title", "## Real", "```bash", "# not a heading", "```", "text"].join("\n");

  const chunks = await chunkDocument("local:a/b.md", content);

  assert.equal(chunks.length, 1);
  assert.equal(chunks[0].section, "Real");
  assert.match(chunks[0].text, /# not a heading/);
});

test("short sections merge forward and oversized sections are split under the limit", async () => {
  const content = [
    "# Doc",
    "## A",
    "tiny",
    "## B",
    "tiny too",
    "## Big",
    "Long sentence here. ".repeat(300),
  ].join("\n");

  const chunks = await chunkDocument("local:x/doc.md", content, { maxChars: 1000 });

  assert.equal(chunks[0].section, "A");
  assert.match(chunks[0].text, /## B/);
  const big = chunks.filter((chunk) => chunk.section === "Big");
  assert.ok(big.length > 1);
  for (const chunk of chunks) assert.ok(chunk.text.length <= 1000, `chunk of ${chunk.text.length} chars`);
});

test("non-markdown sources use plain splitting with a prefix", async () => {
  const chunks = await chunkDocument("local:Passkey/x/diagrams/flow.mmd", "graph TD\nA-->B");

  assert.equal(chunks.length, 1);
  assert.match(chunks[0].text, /^Title: diagrams: flow\nSource: Passkey\/x\/diagrams\/flow\.mmd\n\ngraph TD/);
});

test("source labels drop help-article hashes and the docs folder", () => {
  assert.equal(
    sourceLabel("local:webpage/about-reglink-aa2c1c58da7f.md"),
    "webpage: about reglink",
  );
  assert.equal(
    sourceLabel("local:Passkey/passkey-repo-clamav/docs/ARCHITECTURE.md"),
    "passkey-repo-clamav: ARCHITECTURE",
  );
  assert.equal(
    sourceLabel("https://docs.langchain.com/oss/javascript/deepagents/subagents.md"),
    "deepagents: subagents",
  );
});
