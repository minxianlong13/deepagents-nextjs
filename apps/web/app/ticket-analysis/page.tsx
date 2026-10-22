"use client";

import { useState } from "react";
import { ArrowRight, CircleAlert, LoaderCircle, Ticket } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const ticketKeyPattern = /^(GROUP|PROD)-\d+$/;

type JiraAnalysis = {
  problemSummary: string;
  keywords: string[];
  repo: string | null;
  originalJiraOutput: unknown;
};

export default function TicketAnalysisPage() {
  const [ticketKey, setTicketKey] = useState("");
  const [analysis, setAnalysis] = useState<JiraAnalysis | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedKey = ticketKey.trim().toUpperCase();
  const isTicketKeyValid = ticketKeyPattern.test(normalizedKey);
  const canAnalyze = isTicketKeyValid && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAnalyze) return;

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/ticket-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketKey: normalizedKey }),
      });
      const data = (await response.json()) as {
        analysis?: JiraAnalysis;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this Jira ticket.");
      }

      if (!data.analysis) {
        throw new Error("The Jira agent returned no analysis.");
      }
      setAnalysis(data.analysis);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to analyze this Jira ticket.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#e3f2eb_0,#f8f3eb_42%,#f3e9df_100%)] p-4 md:p-8">
      <div className="relative mx-auto w-full max-w-5xl space-y-6">
        <header className="rise-in flex flex-col gap-3 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="accent" className="mb-3 gap-1.5">
              <Ticket aria-hidden="true" size={13} />
              Jira workflow
            </Badge>
            <h1 className="font-(--font-fashion-display) text-3xl leading-tight text-black md:text-4xl">
              Ticket analysis
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/65">
              Fetch a Jira issue and get a concise problem summary, search
              keywords, and project match.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-black/50">
            GROUP or PROD
          </p>
        </header>

        <Card className="rise-in-delayed border-black/10 bg-white/85">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Jira ticket</CardTitle>
            <CardDescription>
              Enter a ticket key to retrieve and analyze the issue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="grid gap-x-4 gap-y-2 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <label
                htmlFor="ticket-key"
                className="text-sm font-medium text-black/80 sm:col-start-1 sm:row-start-1"
              >
                Ticket key
              </label>
              <Input
                id="ticket-key"
                required
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="GROUP-12345"
                value={ticketKey}
                maxLength={32}
                onChange={(event) => setTicketKey(event.target.value)}
                aria-describedby="ticket-key-hint"
                aria-invalid={ticketKey.length > 0 && !isTicketKeyValid}
                className="h-12 font-mono text-base uppercase sm:col-start-1 sm:row-start-2"
              />
              <p
                id="ticket-key-hint"
                className="text-xs text-black/50 sm:col-start-1 sm:row-start-3"
              >
                Format: GROUP-12345 or PROD-12345
              </p>
              <Button
                type="submit"
                size="lg"
                disabled={!canAnalyze}
                className="gap-2 sm:col-start-2 sm:row-start-2 sm:min-w-40 sm:self-center"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={17}
                    />
                    Analyzing
                  </>
                ) : (
                  <>
                    Analyze ticket
                    <ArrowRight aria-hidden="true" size={17} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 border border-red-900/15 bg-red-50 px-4 py-3 text-sm text-red-950"
          >
            <CircleAlert
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={17}
            />
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div
            aria-live="polite"
            className="border-l-2 border-emerald-700 bg-white/60 px-4 py-3 text-sm text-black/65"
          >
            Fetching the Jira issue and preparing its summary…
          </div>
        )}

        {analysis && (
          <Card className="border-black/10 bg-white/90">
            <CardHeader className="border-b border-black/10">
              <CardTitle className="font-(--font-fashion-display) text-xl">
                Analysis for {normalizedKey}
              </CardTitle>
              <CardDescription>Jira ticket analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-5 py-6 md:px-8">
              <section aria-labelledby="problem-summary-heading">
                <h2
                  id="problem-summary-heading"
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                >
                  Problem summary
                </h2>
                <p className="mt-2 leading-relaxed">
                  {analysis.problemSummary}
                </p>
              </section>

              <section aria-labelledby="keywords-heading">
                <h2
                  id="keywords-heading"
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                >
                  Slack search keywords
                </h2>
                {analysis.keywords.length ? (
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {analysis.keywords.map((keyword) => (
                      <li key={keyword}>{keyword}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-black/60">
                    No useful keywords were identified.
                  </p>
                )}
              </section>

              <section aria-labelledby="repo-heading">
                <h2
                  id="repo-heading"
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                >
                  Project repository
                </h2>
                <p className="mt-2 text-sm">
                  {analysis.repo ?? "No confident repository match."}
                </p>
              </section>

              <details className="border-t border-black/10 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-black/70">
                  Original Jira tool output
                </summary>
                <pre className="mt-3 max-h-100 overflow-auto whitespace-pre-wrap break-words bg-black/[0.03] p-3 text-xs leading-relaxed">
                  {JSON.stringify(analysis.originalJiraOutput, null, 2)}
                </pre>
              </details>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
