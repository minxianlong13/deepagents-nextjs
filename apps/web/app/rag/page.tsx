"use client";

import { useRef, useState } from "react";
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
  id: string;
  role: "user" | "assistant";
  content: string;
};

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome-assistant",
  role: "assistant",
  content:
    "Welcome to **RAG Chat**. Ask a question about the information in your personal knowledge base.",
};

export default function RagPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", content: prompt },
    ]);

    try {
      const response = await fetch("/api/chat/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: prompt }),
      });
      const data = (await response.json()) as {
        output?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to get a RAG response");
      }

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.output || "No response received.",
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to get a RAG response";
      setMessages((current) => [
        ...current,
        { id: `error-${Date.now()}`, role: "assistant", content: message },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() =>
        chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#dff5eb_0,#f9f2eb_38%,#f6efe7_64%,#efe5dc_100%)] p-4 md:p-8">
      <div className="fashion-orb -top-32 -left-16 h-72 w-72 bg-[#7fd8b1]/30" />
      <div className="fashion-orb -right-20 top-24 h-80 w-80 bg-[#d09cff]/18" />

      <div className="relative mx-auto w-full max-w-4xl">
        <Card className="flex min-h-[78vh] flex-col border-black/10 bg-white/78 rise-in-delayed">
          <CardHeader className="border-b border-black/10">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl font-(--font-fashion-display)">
                  RAG Conversation
                </CardTitle>
                <CardDescription>
                  Get answers grounded in your connected knowledge base.
                </CardDescription>
              </div>
              <Badge>{loading ? "Retrieving..." : "Ready"}</Badge>
            </div>
          </CardHeader>

          <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-6">
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
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
              <div ref={chatBottomRef} />
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-3 border-t border-black/10 pt-4"
            >
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask a question about your knowledge base..."
                className="min-h-27.5 resize-none bg-white/90"
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-black/50">
                  Responses are grounded in your configured RAG data.
                </p>
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="lg"
                >
                  {loading ? "Retrieving..." : "Ask RAG"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
