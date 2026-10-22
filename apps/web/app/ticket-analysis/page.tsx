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
import type { TicketTechnicalAnalysis } from "@/lib/agents/ticket_analysis_agent";

const ticketKeyPattern = /^(GROUP|PROD)-\d+$/;

type SlackFinding = {
  channel: string | null;
  author: string | null;
  time: string | null;
  permalink: string | null;
  text: string;
  relevance: string;
};

type JiraAnalysis = {
  problemSummary: string;
  keywords: string[];
  repo: string | null;
  originalJiraOutput: unknown;
  finalAnalysis: TicketTechnicalAnalysis;
  slackReference: {
    available: boolean;
    keywords: string[];
    summary: string;
    findings: SlackFinding[];
    originalSlackOutput: unknown;
  };
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

              <section
                aria-labelledby="slack-reference-heading"
                className="border-t border-black/10 pt-5"
              >
                <h2
                  id="slack-reference-heading"
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                >
                  Slack references
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-black/70">
                  {analysis.slackReference.summary}
                </p>
                {analysis.slackReference.findings.length > 0 ? (
                  <ul className="mt-4 divide-y divide-black/10">
                    {analysis.slackReference.findings.map((finding, index) => (
                      <li
                        key={`${finding.permalink ?? finding.time ?? "slack"}-${index}`}
                        className="py-4"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-black/55">
                          {finding.channel && (
                            <span className="font-semibold text-black/75">
                              {finding.channel}
                            </span>
                          )}
                          {finding.author && <span>{finding.author}</span>}
                          {finding.time && <time>{finding.time}</time>}
                        </div>
                        <p className="mt-2 text-sm leading-relaxed">
                          {finding.text}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-black/55">
                          {finding.relevance}
                        </p>
                        {finding.permalink && (
                          <a
                            href={finding.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-block text-xs font-medium text-emerald-900 underline decoration-emerald-900/30 underline-offset-2"
                          >
                            Open Slack message
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-black/55">
                    No Slack messages are available as references.
                  </p>
                )}
              </section>

              <section
                aria-labelledby="final-analysis-heading"
                className="border-t border-black/10 pt-5"
              >
                <h2
                  id="final-analysis-heading"
                  className="font-(--font-fashion-display) text-2xl text-black"
                >
                  Final technical analysis
                </h2>

                <section
                  className="mt-5"
                  aria-labelledby="ticket-details-heading"
                >
                  <h3
                    id="ticket-details-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Ticket details
                  </h3>
                  <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Key
                      </dt>
                      <dd className="mt-1 font-mono">
                        {analysis.finalAnalysis.ticketDetails.key}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Component
                      </dt>
                      <dd className="mt-1">
                        {analysis.finalAnalysis.ticketDetails.component ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Title
                      </dt>
                      <dd className="mt-1 font-medium">
                        {analysis.finalAnalysis.ticketDetails.title ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Summary
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {analysis.finalAnalysis.ticketDetails.summary ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Description
                      </dt>
                      <dd className="mt-1 whitespace-pre-wrap leading-relaxed">
                        {analysis.finalAnalysis.ticketDetails.description ||
                          "Not specified"}
                      </dd>
                    </div>
                  </dl>
                </section>

                <section
                  className="mt-6"
                  aria-labelledby="expected-actual-heading"
                >
                  <h3
                    id="expected-actual-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Expected and actual behavior
                  </h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Expected
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">
                        {analysis.finalAnalysis.problemIdentification
                          .expectedBehavior || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Actual
                      </p>
                      <p className="mt-1 text-sm leading-relaxed">
                        {analysis.finalAnalysis.problemIdentification
                          .actualBehavior || "Not specified"}
                      </p>
                    </div>
                  </div>
                  {analysis.finalAnalysis.problemIdentification
                    .reproductionSteps.length > 0 && (
                    <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                      {analysis.finalAnalysis.problemIdentification.reproductionSteps.map(
                        (step, index) => (
                          <li key={`${index}-${step}`}>{step}</li>
                        ),
                      )}
                    </ol>
                  )}
                </section>

                <section className="mt-6" aria-labelledby="component-heading">
                  <h3
                    id="component-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Component/project
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    {analysis.finalAnalysis.componentOrProject ||
                      "Not specified"}
                  </p>
                </section>

                <section className="mt-6" aria-labelledby="root-cause-heading">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3
                      id="root-cause-heading"
                      className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                    >
                      Root cause
                    </h3>
                    <span className="text-xs text-black/50">
                      Confidence: {analysis.finalAnalysis.rootCause.confidence}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed">
                    {analysis.finalAnalysis.rootCause.assessment}
                  </p>
                  {analysis.finalAnalysis.rootCause.evidence.length > 0 && (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-black/75">
                      {analysis.finalAnalysis.rootCause.evidence.map(
                        (item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ),
                      )}
                    </ul>
                  )}
                  {analysis.finalAnalysis.rootCause.hypotheses.length > 0 && (
                    <div className="mt-4 border-l-2 border-amber-600/50 pl-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-900">
                        Hypotheses
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {analysis.finalAnalysis.rootCause.hypotheses.map(
                          (item, index) => (
                            <li key={`${index}-${item}`}>{item}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}
                </section>

                <section className="mt-6" aria-labelledby="solution-heading">
                  <h3
                    id="solution-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Suggested solution
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed">
                    {analysis.finalAnalysis.recommendedSolution}
                  </p>
                  <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
                    {analysis.finalAnalysis.implementationSteps.map(
                      (step, index) => (
                        <li key={`${index}-${step}`}>{step}</li>
                      ),
                    )}
                  </ol>
                </section>

                <section className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div aria-labelledby="risks-heading">
                    <h3
                      id="risks-heading"
                      className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                    >
                      Risks and dependencies
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {analysis.finalAnalysis.risksAndDependencies.map(
                        (item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ),
                      )}
                    </ul>
                  </div>
                  <div aria-labelledby="validation-heading">
                    <h3
                      id="validation-heading"
                      className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                    >
                      Validation strategy
                    </h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                      {analysis.finalAnalysis.validationStrategy.map(
                        (item, index) => (
                          <li key={`${index}-${item}`}>{item}</li>
                        ),
                      )}
                    </ul>
                  </div>
                </section>

                <section
                  className="mt-6"
                  aria-labelledby="documentation-heading"
                >
                  <h3
                    id="documentation-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Related documentation
                  </h3>
                  {analysis.finalAnalysis.relatedDocumentation.length > 0 ? (
                    <ul className="mt-2 space-y-2 text-sm">
                      {analysis.finalAnalysis.relatedDocumentation.map(
                        (reference, index) => (
                          <li key={`${index}-${reference.source}`}>
                            <span className="font-medium">
                              {reference.source}
                            </span>
                            <span className="text-black/60">
                              {` - ${reference.relevance}`}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-black/55">
                      No relevant documentation was found.
                    </p>
                  )}
                </section>

                <details className="mt-6 border-t border-black/10 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-black/55">
                    Prompt for code agent
                  </summary>
                  <pre className="mt-3 whitespace-pre-wrap wrap-break-word bg-black/3 p-4 text-sm leading-relaxed">
                    {analysis.finalAnalysis.codeAgentPrompt}
                  </pre>
                </details>
              </section>

              <details className="border-t border-black/10 pt-4">
                <summary className="cursor-pointer text-sm font-medium text-black/70">
                  Original Jira tool output
                </summary>
                <pre className="mt-3 max-h-100 overflow-auto whitespace-pre-wrap wrap-break-word bg-black/3 p-3 text-xs leading-relaxed">
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
