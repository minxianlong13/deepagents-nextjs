"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RagConfigurationPage() {
  const [folderName, setFolderName] = useState("wiki/Passkey");
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [wikiParentId, setWikiParentId] = useState("");
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiPages, setWikiPages] = useState<
    Array<{ contentId: string; title: string; filePath: string }>
  >([]);
  const [wikiError, setWikiError] = useState<string | null>(null);
  const [webpageUrl, setWebpageUrl] = useState("");
  const [webpageLoading, setWebpageLoading] = useState(false);
  const [webpageFile, setWebpageFile] = useState<{
    title: string;
    url: string;
    filePath: string;
  } | null>(null);
  const [webpageError, setWebpageError] = useState<string | null>(null);

  const initializeKnowledgeBase = async () => {
    if (initializing) return;

    setInitializing(true);
    setMessage(null);
    setError(false);

    try {
      const response = await fetch("/api/manage/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName }),
      });
      const data = (await response.json()) as {
        documents?: number;
        chunks?: number;
        skipped?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to initialize the knowledge base",
        );
      }

      setMessage(
        `Indexed ${data.documents ?? 0} changed sources (${data.chunks ?? 0} chunks) and skipped ${data.skipped ?? 0} unchanged sources.`,
      );
    } catch (caughtError) {
      setError(true);
      setMessage(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to initialize the knowledge base",
      );
    } finally {
      setInitializing(false);
    }
  };

  const loadWikiContent = async () => {
    if (wikiLoading) return;

    setWikiLoading(true);
    setWikiPages([]);
    setWikiError(null);

    try {
      const response = await fetch("/api/manage/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: wikiParentId.trim() }),
      });
      const data = (await response.json()) as {
        files?: Array<{ contentId: string; title: string; filePath: string }>;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Unable to load wiki content",
        );
      }

      setWikiPages(data.files ?? []);
    } catch (caughtError) {
      setWikiError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load wiki content",
      );
    } finally {
      setWikiLoading(false);
    }
  };

  const ingestWebpage = async () => {
    if (webpageLoading) return;

    setWebpageLoading(true);
    setWebpageFile(null);
    setWebpageError(null);

    try {
      const response = await fetch("/api/manage/webpage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webpageUrl.trim() }),
      });
      const data = (await response.json()) as {
        title?: string;
        url?: string;
        filePath?: string;
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(
          data.details || data.error || "Unable to ingest webpage",
        );
      }

      setWebpageFile({
        title: data.title ?? "Webpage",
        url: data.url ?? webpageUrl.trim(),
        filePath: data.filePath ?? "docs/webpage",
      });
    } catch (caughtError) {
      setWebpageError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to ingest webpage",
      );
    } finally {
      setWebpageLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">

      <div className="relative mx-auto w-full max-w-5xl">
        <Card className="border-black/10 bg-white/78 rise-in-delayed">
          <CardHeader className="border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-(--font-fashion-display)">
                  RAG Configuration
                </CardTitle>
                <CardDescription>
                  Prepare your personal knowledge base for RAG retrieval.
                </CardDescription>
              </div>
              <Badge>{initializing ? "Indexing..." : "Ready"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-4 md:p-6">
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Knowledge base</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-black/65">
                Choose <code>.</code> to index all local docs plus remote
                metadata, or choose a subfolder under <code>./docs</code>. Local
                folders are indexed from their files; folders under{" "}
                <code>remote</code>{" "}use their JSON metadata to fetch remote
                sources. Unchanged sources are skipped.
              </p>
              <label className="block max-w-xl space-y-2 text-sm font-medium">
                Docs subfolder
                <input
                  type="text"
                  value={folderName}
                  onChange={(event) => setFolderName(event.target.value)}
                  placeholder="wiki/Passkey"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-3 py-2 font-normal outline-none focus:border-black"
                  disabled={initializing}
                />
                <span className="block text-xs font-normal text-black/55">
                  Enter <code>.</code> for the whole docs folder, or a path
                  relative to <code>./docs</code>, such as
                  <code className="ml-1">wiki/Passkey</code> or
                  <code className="ml-1">remote</code>.
                </span>
              </label>
              <Button
                type="button"
                size="lg"
                onClick={initializeKnowledgeBase}
                disabled={initializing}
              >
                {initializing
                  ? "Loading documents and indexing..."
                  : "Initialize knowledge base"}
              </Button>
            </section>

            {message ? (
              <p
                role="status"
                className={`rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? "border-red-300 bg-red-50 text-red-800"
                    : "border-emerald-300 bg-emerald-50 text-emerald-800"
                }`}
              >
                {message}
              </p>
            ) : null}

            <section className="space-y-3 border-t border-black/10 pt-6">
              <div>
                <h2 className="text-lg font-semibold">Wiki files</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-black/65">
                  Enter a Confluence parent page ID to call the MCP
                  <code className="mx-1">get_wiki_content</code> method. The
                  parent and all descendant pages will be saved as files.
                </p>
              </div>
              <label className="block max-w-xl space-y-2 text-sm font-medium">
                Wiki parent ID
                <input
                  type="text"
                  inputMode="numeric"
                  value={wikiParentId}
                  onChange={(event) => setWikiParentId(event.target.value)}
                  placeholder="65655871"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-3 py-2 font-normal outline-none focus:border-black"
                  disabled={wikiLoading}
                />
                <span className="block text-xs font-normal text-black/55">
                  Use the numeric content ID from the wiki page URL.
                </span>
              </label>
              <Button
                type="button"
                size="lg"
                onClick={loadWikiContent}
                disabled={wikiLoading || !/^\d+$/.test(wikiParentId.trim())}
              >
                {wikiLoading ? "Loading wiki pages..." : "Fetch wiki files"}
              </Button>

              {wikiError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {wikiError}
                </p>
              ) : null}

              {wikiPages.length > 0 ? (
                <div className="space-y-3 rounded-xl border border-black/10 bg-white/75 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Retrieved {wikiPages.length} page
                      {wikiPages.length === 1 ? "" : "s"}
                    </p>
                    <Badge variant="accent">MCP: get_wiki_content</Badge>
                  </div>
                  <ul className="space-y-1 text-xs text-black/65">
                    {wikiPages.map((page) => (
                      <li key={page.contentId}>
                        {page.title}{" "}
                        <span className="text-black/40">
                          ({page.contentId})
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="space-y-3 border-t border-black/10 pt-6">
              <div>
                <h2 className="text-lg font-semibold">Webpage files</h2>
                <p className="max-w-2xl text-sm leading-relaxed text-black/65">
                  Enter a public webpage URL to render it through the MCP
                  <code className="mx-1">ingest_webpage</code> tool and save the
                  extracted Markdown in <code>docs/webpage</code>.
                </p>
              </div>
              <label className="block max-w-xl space-y-2 text-sm font-medium">
                Webpage URL
                <input
                  type="url"
                  value={webpageUrl}
                  onChange={(event) => setWebpageUrl(event.target.value)}
                  placeholder="https://example.com/article"
                  className="w-full rounded-xl border border-black/15 bg-white/90 px-3 py-2 font-normal outline-none focus:border-black"
                  disabled={webpageLoading}
                />
              </label>
              <Button
                type="button"
                size="lg"
                onClick={ingestWebpage}
                disabled={webpageLoading || !webpageUrl.trim()}
              >
                {webpageLoading ? "Extracting webpage..." : "Save as Markdown"}
              </Button>

              {webpageError ? (
                <p
                  role="alert"
                  className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {webpageError}
                </p>
              ) : null}

              {webpageFile ? (
                <div className="space-y-2 rounded-xl border border-black/10 bg-white/75 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium">
                      Saved {webpageFile.title}
                    </p>
                    <Badge variant="accent">MCP: ingest_webpage</Badge>
                  </div>
                  <p className="break-all text-xs text-black/55">
                    {webpageFile.url}
                  </p>
                  <p className="text-xs text-black/65">
                    File: <code>{webpageFile.filePath}</code>
                  </p>
                </div>
              ) : null}
            </section>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
