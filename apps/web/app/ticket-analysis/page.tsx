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
  ticketContract: TicketTechnicalAnalysis["workflowContract"];
  finalAnalysis: TicketTechnicalAnalysis;
  slackReference: {
    available: boolean;
    keywords: string[];
    summary: string;
    findings: SlackFinding[];
    originalSlackOutput: unknown;
  };
};

type WorkflowStep = "jira" | "contract" | "slack" | "analysis";

type JiraStepResult = Pick<
  JiraAnalysis,
  "problemSummary" | "keywords" | "repo" | "originalJiraOutput"
>;

type WorkflowState = {
  jira: JiraStepResult | null;
  ticketContract: TicketTechnicalAnalysis["workflowContract"] | null;
  slackReference: JiraAnalysis["slackReference"] | null;
  finalAnalysis: TicketTechnicalAnalysis | null;
};

const workflowSteps: Array<{ id: WorkflowStep; label: string }> = [
  { id: "jira", label: "Retrieve Jira" },
  { id: "contract", label: "Define ticket contract" },
  { id: "slack", label: "Search Slack" },
  { id: "analysis", label: "Generate technical analysis" },
];

export default function TicketAnalysisPage() {
  const [ticketKey, setTicketKey] = useState("");
  const [analysis, setAnalysis] = useState<JiraAnalysis | null>(null);
  const [workflow, setWorkflow] = useState<WorkflowState>({
    jira: null,
    ticketContract: null,
    slackReference: null,
    finalAnalysis: null,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedKey = ticketKey.trim().toUpperCase();
  const isTicketKeyValid = ticketKeyPattern.test(normalizedKey);
  const canAnalyze = isTicketKeyValid && !loading;

  const completedStepIndex = workflow.finalAnalysis
    ? 3
    : workflow.slackReference
      ? 2
      : workflow.ticketContract
        ? 1
        : workflow.jira
          ? 0
          : -1;
  const nextStep = workflowSteps[completedStepIndex + 1];

  const runStep = async (step: WorkflowStep) => {
    if (loading) return;
    setLoading(true);
    setError("");
    if (step === "jira") {
      setAnalysis(null);
      setWorkflow({
        jira: null,
        ticketContract: null,
        slackReference: null,
        finalAnalysis: null,
      });
    }

    try {
      const response = await fetch("/api/ticket-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketKey: normalizedKey,
          step,
          jira: workflow.jira,
          ticketContract: workflow.ticketContract,
          slackReference: workflow.slackReference,
        }),
      });
      const data = (await response.json()) as {
        result?: unknown;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to analyze this Jira ticket.");
      }

      if (data.result === undefined) {
        throw new Error("The workflow step returned no result.");
      }

      setWorkflow((previous) => {
        const next = { ...previous };
        if (step === "jira") next.jira = data.result as JiraStepResult;
        if (step === "contract") {
          next.ticketContract = data.result as TicketTechnicalAnalysis["workflowContract"];
        }
        if (step === "slack") {
          next.slackReference = data.result as JiraAnalysis["slackReference"];
        }
        if (step === "analysis") {
          next.finalAnalysis = data.result as TicketTechnicalAnalysis;
          if (next.jira && next.ticketContract && next.slackReference) {
            setAnalysis({
              ...next.jira,
              ticketContract: next.ticketContract,
              slackReference: next.slackReference,
              finalAnalysis: next.finalAnalysis,
            });
          }
        }
        return next;
      });
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canAnalyze) return;
    await runStep("jira");
  };

  const handleNextStep = async () => {
    if (nextStep) await runStep(nextStep.id);
  };

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="relative mx-auto w-full max-w-6xl space-y-6">
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
            Running the selected workflow step…
          </div>
        )}

        {workflow.jira && (
          <Card className="border-black/10 bg-white/90">
            <CardHeader className="border-b border-black/10">
              <CardTitle className="font-(--font-fashion-display) text-xl">
                Workflow progress for {normalizedKey}
              </CardTitle>
              <CardDescription>
                Review each result before running the next step.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-5 py-6 md:px-8">
              <ol className="grid gap-2 sm:grid-cols-4">
                {workflowSteps.map((step, index) => (
                  <li
                    key={step.id}
                    className={`border px-3 py-2 text-xs ${
                      index <= completedStepIndex
                        ? "border-emerald-800/30 bg-emerald-50 text-emerald-950"
                        : "border-black/10 text-black/50"
                    }`}
                  >
                    <span className="font-mono">{index + 1}.</span> {step.label}
                  </li>
                ))}
              </ol>

              <section aria-labelledby="jira-step-result-heading">
                <h2
                  id="jira-step-result-heading"
                  className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                >
                  Jira retrieval result
                </h2>
                <p className="mt-2 text-sm leading-relaxed">
                  {workflow.jira.problemSummary}
                </p>
                <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase text-black/50">
                      Search keywords
                    </p>
                    <p className="mt-1">
                      {workflow.jira.keywords.length
                        ? workflow.jira.keywords.join(", ")
                        : "None identified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-black/50">
                      Repository
                    </p>
                    <p className="mt-1">
                      {workflow.jira.repo ?? "No confident match"}
                    </p>
                  </div>
                </div>
              </section>

              {workflow.ticketContract && (
                <section
                  aria-labelledby="contract-step-result-heading"
                  className="border-t border-black/10 pt-5"
                >
                  <h2
                    id="contract-step-result-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Ticket contract result
                  </h2>
                  <p className="mt-2 text-sm capitalize">
                    {workflow.ticketContract.ticketType} ·{" "}
                    {workflow.ticketContract.readiness}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed">
                    {workflow.ticketContract.requestedOutcome}
                  </p>
                  <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Expected behavior
                      </p>
                      <p className="mt-1">
                        {workflow.ticketContract.expectedBehavior}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Actual behavior
                      </p>
                      <p className="mt-1">
                        {workflow.ticketContract.actualBehavior}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm">
                    <span className="font-medium">Scope:</span>{" "}
                    {workflow.ticketContract.scope.length
                      ? workflow.ticketContract.scope.join(", ")
                      : "Not specified"}
                  </p>
                  {workflow.ticketContract.openQuestions.length > 0 && (
                    <p className="mt-2 text-sm text-amber-900">
                      Open questions: {workflow.ticketContract.openQuestions.join(
                        "; ",
                      )}
                    </p>
                  )}
                </section>
              )}

              {workflow.slackReference && (
                <section
                  aria-labelledby="slack-step-result-heading"
                  className="border-t border-black/10 pt-5"
                >
                  <h2
                    id="slack-step-result-heading"
                    className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                  >
                    Slack search result
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed">
                    {workflow.slackReference.summary}
                  </p>
                  <p className="mt-2 text-xs text-black/55">
                    Findings: {workflow.slackReference.findings.length}
                  </p>
                </section>
              )}

              {nextStep && (
                <div className="border-t border-black/10 pt-5">
                  <Button
                    type="button"
                    onClick={handleNextStep}
                    disabled={loading}
                    className="gap-2"
                  >
                    Next: {nextStep.label}
                    <ArrowRight aria-hidden="true" size={17} />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
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
                  aria-labelledby="workflow-contract-heading"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3
                      id="workflow-contract-heading"
                      className="text-sm font-semibold uppercase tracking-[0.08em] text-black/55"
                    >
                      Workflow contract
                    </h3>
                    <span className="text-xs text-black/50">
                      {analysis.finalAnalysis.workflowContract.readiness}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium capitalize">
                    {analysis.finalAnalysis.workflowContract.ticketType}
                  </p>
                  <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Requested outcome
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {analysis.finalAnalysis.workflowContract.requestedOutcome ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Expected behavior
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {analysis.finalAnalysis.workflowContract.expectedBehavior ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Actual behavior
                      </dt>
                      <dd className="mt-1 leading-relaxed">
                        {analysis.finalAnalysis.workflowContract.actualBehavior ||
                          "Not specified"}
                      </dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium uppercase text-black/50">
                        Scope
                      </dt>
                      <dd className="mt-1">
                        {analysis.finalAnalysis.workflowContract.scope.length >
                        0
                          ? analysis.finalAnalysis.workflowContract.scope.join(
                              ", ",
                            )
                          : "Not specified"}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Confirmed facts
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {analysis.finalAnalysis.workflowContract.confirmedFacts.map(
                          (fact, index) => (
                            <li key={index}>{fact}</li>
                          ),
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Open questions
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {analysis.finalAnalysis.workflowContract.openQuestions.map(
                          (question, index) => (
                            <li key={index}>{question}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Acceptance criteria
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {analysis.finalAnalysis.workflowContract.acceptanceCriteria.map(
                          (criterion, index) => (
                            <li key={index}>{criterion}</li>
                          ),
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-black/50">
                        Constraints and dependencies
                      </p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                        {analysis.finalAnalysis.workflowContract.constraintsAndDependencies.map(
                          (item, index) => (
                            <li key={index}>{item}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  </div>
                  <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-medium text-black/65">
                      Field provenance
                    </summary>
                    <ul className="mt-2 space-y-2 border-l-2 border-black/10 pl-3 text-black/70">
                      {analysis.finalAnalysis.workflowContract.fieldProvenance.map(
                        (item, index) => (
                          <li key={index}>
                            <span className="font-medium">{item.field}</span>
                            {` — ${item.status}; ${item.source}. ${item.note}`}
                          </li>
                        ),
                      )}
                    </ul>
                  </details>
                </section>

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
