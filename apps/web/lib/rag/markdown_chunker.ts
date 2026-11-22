import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// Structure-aware chunking for the knowledge base.
//
// Markdown is split on headings so a chunk never starts mid-section, and every
// chunk is prefixed with its document title, source and heading path, so the
// embedding carries that context even when the section text does not.

export type ChunkOptions = {
  /** Upper bound for a chunk's text, prefix included. */
  maxChars?: number;
  /** Sections shorter than this are merged with the following sections. */
  minChars?: number;
  /** Overlap used only when an oversized section has to be split. */
  overlap?: number;
};

export type Chunk = {
  text: string;
  title?: string;
  section?: string;
};

type Section = { path: string[]; body: string };

const DEFAULTS = { maxChars: 1500, minChars: 400, overlap: 150 };
const HEADING = /^(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/;
const FENCE = /^[ \t]*(```|~~~)/;

export function isMarkdownSource(source: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(source.split(/[?#]/)[0]);
}

function cleanHeading(text: string): string {
  return text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links -> link text
    .replace(/\\([\\`*_{}[\]()#+\-.!])/g, "$1") // markdown escapes
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitFrontmatter(content: string): {
  fields: Record<string, string>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(content);
  if (!match) return { fields: {}, body: content };

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const field = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (field) fields[field[1]] = field[2].replace(/^["']|["']$/g, "").trim();
  }
  return { fields, body: content.slice(match[0].length) };
}

/** Readable label for a source, used when a document has no usable title. */
export function sourceLabel(source: string): string {
  const withoutScheme = source.replace(/^local:/, "").replace(/^https?:\/\//, "");
  const parts = withoutScheme.split("/").filter(Boolean);
  const file = (parts.pop() ?? withoutScheme).replace(/\.[a-z0-9]+$/i, "");
  // Help articles are saved as "<slug>-<12 hex chars>.md".
  const name = file.replace(/-[0-9a-f]{12}$/i, "").replace(/[-_]+/g, " ");
  const parent = parts.filter((part) => part !== "docs").pop();
  return parent ? `${parent}: ${name}` : name;
}

function parseSections(body: string): { sections: Section[]; h1s: string[] } {
  const sections: Section[] = [];
  const h1s: string[] = [];
  const stack: string[] = [];
  let current: Section = { path: [], body: "" };
  let inFence = false;

  for (const line of body.split(/\r?\n/)) {
    if (FENCE.test(line)) inFence = !inFence;
    const heading = inFence ? null : HEADING.exec(line);

    if (heading) {
      const level = heading[1].length;
      const text = cleanHeading(heading[2]);
      if (!text) {
        current.body += `${line}\n`;
        continue;
      }
      if (level === 1) h1s.push(text);
      sections.push(current);
      stack.length = level - 1;
      stack[level - 1] = text;
      current = { path: stack.filter(Boolean), body: `${line}\n` };
    } else {
      current.body += `${line}\n`;
    }
  }
  sections.push(current);

  return {
    sections: sections.filter((section) => section.body.trim()),
    h1s,
  };
}

function buildPrefix(title: string | undefined, source: string, path: string[]) {
  const lines = [];
  if (title) lines.push(`Title: ${title}`);
  lines.push(`Source: ${source.replace(/^local:/, "")}`);
  if (path.length) lines.push(`Section: ${path.join(" > ")}`);
  return `${lines.join("\n")}\n\n`;
}

async function splitOversized(
  text: string,
  budget: number,
  overlap: number,
  markdown: boolean,
): Promise<string[]> {
  if (text.length <= budget) return [text];
  const options = {
    chunkSize: Math.max(budget, 200),
    chunkOverlap: Math.min(overlap, Math.floor(budget / 4)),
  };
  const splitter = markdown
    ? RecursiveCharacterTextSplitter.fromLanguage("markdown", options)
    : new RecursiveCharacterTextSplitter(options);
  return splitter.splitText(text);
}

export async function chunkDocument(
  source: string,
  content: string,
  options: ChunkOptions = {},
): Promise<Chunk[]> {
  const { maxChars, minChars, overlap } = { ...DEFAULTS, ...options };
  const markdown = isMarkdownSource(source);

  if (!markdown) {
    const title = sourceLabel(source);
    const prefix = buildPrefix(title, source, []);
    const pieces = await splitOversized(
      content.trim(),
      maxChars - prefix.length,
      overlap,
      false,
    );
    return pieces
      .filter((piece) => piece.trim())
      .map((piece) => ({ text: prefix + piece.trim(), title }));
  }

  const { fields, body } = splitFrontmatter(content);
  const { sections, h1s } = parseSections(body);

  // A single H1 is the document title. Several H1s (common in exported wiki
  // pages) are top-level sections, so keep them in the heading path instead.
  const titleH1 = h1s.length === 1 ? h1s[0] : undefined;
  const baseTitle = fields.title || titleH1 || sourceLabel(source);
  const project = fields.project_name;
  const title =
    project && !baseTitle.includes(project) ? `${baseTitle} (${project})` : baseTitle;

  const normalized = sections
    .map((section) => {
      const path = titleH1 && section.path[0] === titleH1 ? section.path.slice(1) : section.path;
      // The title H1 line itself is already in the prefix.
      const text =
        titleH1 && section.path.length === 1 && section.path[0] === titleH1
          ? section.body.replace(/^#[ \t]+.*\n/, "")
          : section.body;
      return { path, body: text.trim() };
    })
    .filter((section) => section.body);

  // Merge short sections forward so a heading with one line of text does not
  // become its own chunk. The merged chunk keeps the first section's path,
  // unless that section was only headings, in which case the more specific
  // path of the section it merges into is used. Later headings remain visible
  // in the text.
  const merged: Section[] = [];
  for (const section of normalized) {
    const last = merged[merged.length - 1];
    if (
      last &&
      last.body.length < minChars &&
      last.body.length + section.body.length + 2 <= maxChars
    ) {
      const headingsOnly = last.body
        .split("\n")
        .every((line) => !line.trim() || HEADING.test(line));
      if (headingsOnly) last.path = [...section.path];
      last.body = `${last.body}\n\n${section.body}`;
    } else {
      merged.push({ path: [...section.path], body: section.body });
    }
  }

  const chunks: Chunk[] = [];
  for (const section of merged) {
    const prefix = buildPrefix(title, source, section.path);
    const pieces = await splitOversized(
      section.body,
      maxChars - prefix.length,
      overlap,
      true,
    );
    for (const piece of pieces) {
      if (!piece.trim()) continue;
      chunks.push({
        text: prefix + piece.trim(),
        title,
        ...(section.path.length ? { section: section.path.join(" > ") } : {}),
      });
    }
  }
  return chunks;
}
