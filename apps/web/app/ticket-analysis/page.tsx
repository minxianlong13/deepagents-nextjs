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
import type { JiraTicketGetAgentResult } from "@/lib/agents/get_jira_ticket_agent";

const ticketKeyPattern = /^(GROUP|PROD)-\d+$/;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "Not provided";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) return value.map(formatValue).join("\n\n");

  const record = asRecord(value);
  for (const key of ["displayName", "name", "value", "body", "text"]) {
    if (typeof record[key] === "string") return record[key] as string;
  }
  if (Array.isArray(record.content)) return formatValue(record.content);
  return JSON.stringify(value, null, 2);
}

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function TicketAnalysisPage() {
  const [ticketKey, setTicketKey] = useState("");
  const [result, setResult] = useState<JiraTicketGetAgentResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const normalizedKey = ticketKey.trim().toUpperCase();
  const isTicketKeyValid = ticketKeyPattern.test(normalizedKey);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isTicketKeyValid || loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/ticket-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketKey: normalizedKey }),
      });
      const data = (await response.json()) as {
        result?: JiraTicketGetAgentResult;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error ?? "Unable to analyze this Jira ticket.");
      if (!data.result)
        throw new Error("The Jira analysis returned no result.");
      setResult(data.result);
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

  const fields = Object.entries(asRecord(result?.originalJiraOutput.fields));
  const ticketUrl = safeExternalUrl(result?.originalJiraOutput.url);

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="rise-in flex flex-col gap-3 border-b border-black/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge variant="accent" className="mb-3 gap-1.5">
              <Ticket aria-hidden="true" size={13} />
              Jira
            </Badge>
            <h1 className="font-(--font-fashion-display) text-3xl leading-tight text-black md:text-4xl">
              Understand a ticket
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-black/65">
              Retrieve a Jira issue and get a plain-language explanation of the
              reported problem.
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
              Enter the ticket key to retrieve and explain the issue.
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
                disabled={!isTicketKeyValid || loading}
                className="gap-2 sm:col-start-2 sm:row-start-2 sm:min-w-40 sm:self-center"
              >
                {loading ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={17}
                    />
                    Retrieving
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
            Retrieving Jira details and analyzing the reported problem…
          </div>
        )}

        {result && (
          <div className="space-y-5" aria-live="polite">
            <Card className="border-black/10 bg-white/90">
              <CardHeader className="border-b border-black/10">
                <CardTitle className="font-(--font-fashion-display) text-xl">
                  Problem summary
                </CardTitle>
                <CardDescription>
                  {ticketUrl ? (
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      Open {result.ticketKey} in Jira
                    </a>
                  ) : (
                    result.ticketKey
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-5">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/85">
                  {result.problemSummary}
                </p>
              </CardContent>
            </Card>

            <Card className="border-black/10 bg-white/90">
              <CardHeader>
                <CardTitle className="text-lg">Ticket details</CardTitle>
                <CardDescription>
                  {formatValue(
                    asRecord(result.originalJiraOutput.fields).summary,
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="divide-y divide-black/10">
                  {fields.map(([name, value]) => (
                    <div
                      key={name}
                      className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4"
                    >
                      <dt className="text-xs font-medium uppercase text-black/50">
                        {name.replaceAll(/([A-Z])/g, " $1")}
                      </dt>
                      <dd className="whitespace-pre-wrap wrap-break-word text-sm leading-relaxed text-black/80">
                        {formatValue(value)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
