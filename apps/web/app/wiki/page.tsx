"use client";

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import repositoryNames from "@/config/repos.json";
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
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  context?: string;
};

const repositories = repositoryNames as string[];
const defaultRepository = repositories.includes("deepagents-nextjs")
  ? "deepagents-nextjs"
  : (repositories[0] ?? "");

export default function OpenWikiPage() {
  const [scope, setScope] = useState<"repository" | "workspace">("workspace");
  const [repo, setRepo] = useState(defaultRepository);
  const [workspace, setWorkspace] = useState("passkey");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const prompt = question.trim();
    const selectedWorkspace = workspace.trim();
    if (
      !prompt ||
      loading ||
      (scope === "repository" && !repo) ||
      (scope === "workspace" && !selectedWorkspace)
    )
      return;

    const requestBody =
      scope === "repository"
        ? { scope, repo, question: prompt }
        : { scope, workspace: selectedWorkspace, question: prompt };
    const context =
      scope === "repository"
        ? `Repository · ${repo}`
        : `Workspace · ${selectedWorkspace}`;

    setQuestion("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: prompt,
        context,
      },
    ]);

    try {
      const response = await fetch("/api/chat/openwiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = (await response.json()) as {
        output?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to search OpenWiki.");
      }
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.output || "No OpenWiki answer was returned.",
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Unable to search OpenWiki.",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-7.5rem)] p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl">
        <Card className="flex min-h-[78vh] flex-col border-black/10 bg-white/85">
          <CardHeader className="border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Badge variant="accent" className="mb-2">
                  Repository knowledge
                </Badge>
                <CardTitle className="font-(--font-fashion-display) text-xl">
                  OpenWiki Chat
                </CardTitle>
                <CardDescription>
                  Search repository knowledge and ask follow-up questions.
                </CardDescription>
              </div>
              <Badge>{loading ? "Searching..." : "Ready"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
              {messages.length === 0 && (
                <p className="m-auto max-w-lg text-center text-sm leading-relaxed text-black/50">
                  Ask a question, search a workspace, or read specific wiki
                  sections.
                </p>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[88%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                    message.role === "user"
                      ? "ml-auto border-black bg-black text-white"
                      : "border-border bg-secondary text-foreground"
                  }`}
                >
                  {message.context && (
                    <p className="mb-2 text-[11px] text-current/65">
                      {message.context}
                    </p>
                  )}
                  {message.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-3 border-t border-black/10 pt-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-medium text-black/60">
                  Search scope
                  <select
                    value={scope}
                    onChange={(event) =>
                      setScope(event.target.value as "repository" | "workspace")
                    }
                    className="h-10 min-w-0 rounded-md border border-input bg-white px-3 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="repository">Repository</option>
                    <option value="workspace">Workspace</option>
                  </select>
                </label>
                {scope === "repository" ? (
                  <label className="grid gap-1.5 text-xs font-medium text-black/60">
                    Repository
                    <select
                      value={repo}
                      onChange={(event) => setRepo(event.target.value)}
                      className="h-10 min-w-0 rounded-md border border-input bg-white px-3 text-sm text-black outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      required
                    >
                      {repositories.map((repository) => (
                        <option key={repository} value={repository}>
                          {repository}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <label className="grid gap-1.5 text-xs font-medium text-black/60">
                    OpenWiki workspace
                    <Input
                      value={workspace}
                      onChange={(event) => setWorkspace(event.target.value)}
                      maxLength={80}
                      required
                      placeholder="passkey"
                      className="h-10 bg-white/90 text-sm"
                    />
                  </label>
                )}
              </div>
              <Textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask a question about this repository or workspace..."
                maxLength={2000}
                className="min-h-24 resize-y bg-white/90"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-black/50">
                  {scope === "repository"
                    ? `Searching ${repo || "a repository"}`
                    : `Searching workspace ${workspace || "passkey"}`}
                </p>
                <Button
                  type="submit"
                  disabled={
                    loading ||
                    !question.trim() ||
                    (scope === "repository" && !repo) ||
                    (scope === "workspace" && !workspace.trim())
                  }
                  size="lg"
                >
                  {loading ? "Searching..." : "Ask OpenWiki"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
