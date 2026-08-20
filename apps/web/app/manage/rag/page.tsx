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
  const [initializing, setInitializing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState(false);

  const initializeKnowledgeBase = async () => {
    if (initializing) return;

    setInitializing(true);
    setMessage(null);
    setError(false);

    try {
      const response = await fetch("/api/manage/rag", { method: "POST" });
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

  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#e6e1ff_0,#f9f2eb_38%,#f6efe7_64%,#efe5dc_100%)] p-4 md:p-8">
      <div className="fashion-orb -top-32 -left-16 h-72 w-72 bg-[#b9a6ff]/25" />
      <div className="fashion-orb -right-20 top-24 h-80 w-80 bg-[#7fd8b1]/22" />

      <div className="relative mx-auto w-full max-w-4xl">
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
                Initialization scans files in the docs folder and configured
                internet sources. Only new or changed sources are split,
                embedded, and stored in Pinecone. Unchanged sources are skipped.
              </p>
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
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
