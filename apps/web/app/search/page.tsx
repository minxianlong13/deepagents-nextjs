"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const STARTER_PROMPTS = [
  "What are the latest AI coding agent trends in 2026?",
  "Compare React vs Svelte for a small startup app.",
  "Summarize today's top cybersecurity news with sources.",
  "Find practical ways to improve focus while working remotely.",
];

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content:
        "Welcome to **DeepAgents Search Chat**. Ask anything and I will search online information, then prepare a clear and reasonable answer.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: prompt,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: prompt }),
      });

      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: data.output || "No response received.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content:
            "I couldn't reach the search service right now. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };

  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe4db_0,#f9f2eb_38%,#f6efe7_64%,#efe5dc_100%)] p-4 md:p-8">
      <div className="fashion-orb -top-32 -left-16 h-72 w-72 bg-[#ff9f85]/35" />
      <div className="fashion-orb -right-20 top-24 h-80 w-80 bg-[#d09cff]/22" />

      <div className="relative mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.65fr]">
        <Card className="h-fit border-black/10 bg-white/70 rise-in">
          <CardHeader>
            <Badge variant="accent" className="w-fit">
              Personal Search Assistant
            </Badge>
            <CardTitle className="pt-3 text-4xl leading-tight md:text-5xl font-(--font-fashion-display)">
              DeepAgent Search
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-black/75">
              A personal search helper that checks information on the internet
              and prepares practical, reasonable answers for your questions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-black/55">
              Quick prompts
            </p>
            <div className="flex flex-wrap gap-2">
              {STARTER_PROMPTS.map((prompt, index) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-full border border-black/10 bg-white/80 px-3 py-1.5 text-xs text-black/75 transition hover:border-black/20 hover:bg-white"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="flex min-h-[78vh] flex-col border-black/10 bg-white/78 rise-in-delayed">
          <CardHeader className="border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-(--font-fashion-display)">
                  Search Conversation
                </CardTitle>
                <CardDescription>
                  Ask your question and get an answer synthesized from web
                  information.
                </CardDescription>
              </div>
              <Badge>{loading ? "Searching..." : "Online"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                    message.role === "user"
                      ? "ml-auto border-black bg-black text-white"
                      : "border-black/10 bg-[#fffaf6] text-black"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-3 border-t border-black/10 pt-4"
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything you want to search on the internet..."
                className="min-h-27.5 resize-none bg-white/90"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-black/50">
                  Markdown responses enabled for better readability.
                </p>
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="lg"
                >
                  {loading ? "Searching web..." : "Search"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
