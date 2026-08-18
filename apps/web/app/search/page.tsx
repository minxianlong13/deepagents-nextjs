"use client";

import { useEffect, useRef, useState } from "react";
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

type Conversation = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { content: string; role: string }[];
};

const DEFAULT_ASSISTANT_MESSAGE: ChatMessage = {
  id: "welcome-assistant",
  role: "assistant",
  content:
    "Welcome to **DeepAgents Search Chat**. Ask anything and I will search online information, then prepare a clear and reasonable answer.",
};

export default function SearchPage() {
  const [input, setInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    DEFAULT_ASSISTANT_MESSAGE,
  ]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      try {
        const res = await fetch("/api/chat/history", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load history");

        const data = (await res.json()) as { conversations?: Conversation[] };
        if (cancelled) return;

        setConversations(data.conversations ?? []);
      } catch {
        // leave conversations empty on error
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadConversations();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadConversationMessages = async (conversation: Conversation) => {
    if (activeConversationId === conversation.id) return;
    setActiveConversationId(conversation.id);

    try {
      const res = await fetch(
        `/api/chat/history?conversationId=${conversation.id}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error("Failed to load messages");
      const data = (await res.json()) as { messages?: ChatMessage[] };
      setChatMessages(
        data.messages && data.messages.length > 0
          ? data.messages
          : [DEFAULT_ASSISTANT_MESSAGE],
      );
    } catch {
      setChatMessages([DEFAULT_ASSISTANT_MESSAGE]);
    }
  };

  const startNewChat = () => {
    setActiveConversationId(null);
    setChatMessages([DEFAULT_ASSISTANT_MESSAGE]);
  };

  const getConversationPreview = (conversation: Conversation) => {
    const firstMsg = conversation.messages[0];
    if (!firstMsg) return "Empty conversation";
    const plain = firstMsg.content.replace(/\s+/g, " ").trim();
    return plain.length > 60 ? `${plain.slice(0, 60)}...` : plain;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: prompt,
          ...(activeConversationId
            ? { conversationId: activeConversationId }
            : {}),
        }),
      });

      if (!res.ok) throw new Error("Failed to get assistant response");

      const data = (await res.json()) as {
        output?: string;
        conversationId?: string;
        isNewConversation?: boolean;
        userMessage?: ChatMessage;
        assistantMessage?: ChatMessage;
      };

      const {
        userMessage,
        assistantMessage,
        conversationId,
        isNewConversation,
      } = data;

      if (userMessage && assistantMessage) {
        setChatMessages((prev) => {
          const base = prev[0]?.id === "welcome-assistant" ? [] : prev;
          return [...base, userMessage, assistantMessage];
        });
      }

      if (conversationId) {
        setActiveConversationId(conversationId);

        if (isNewConversation) {
          // prepend the new conversation to the sidebar list
          const title =
            prompt.length > 60 ? `${prompt.slice(0, 60)}...` : prompt;
          setConversations((prev) => [
            {
              id: conversationId,
              title,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              messages: [{ content: prompt, role: "user" }],
            },
            ...prev,
          ]);
        }
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I couldn't reach the search service right now. Try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden bg-[radial-gradient(circle_at_top_left,#ffe4db_0,#f9f2eb_38%,#f6efe7_64%,#efe5dc_100%)] p-4 md:p-8">
      <div className="fashion-orb -top-32 -left-16 h-72 w-72 bg-[#ff9f85]/35" />
      <div className="fashion-orb -right-20 top-24 h-80 w-80 bg-[#d09cff]/22" />

      <div className="relative mx-auto w-full max-w-7xl">
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
            <div className="grid flex-1 gap-4 md:grid-cols-[15rem_1fr]">
              <aside className="rounded-2xl border border-black/10 bg-white/70 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-black/55">
                    Conversation History
                  </p>
                  <Badge>{conversations.length}</Badge>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={startNewChat}
                  className="mb-3 w-full text-xs"
                >
                  + New Chat
                </Button>

                <div className="max-h-64 space-y-2 overflow-y-auto pr-1 md:max-h-[calc(78vh-22rem)]">
                  {historyLoading ? (
                    <p className="px-2 text-xs text-black/55">
                      Loading conversations...
                    </p>
                  ) : conversations.length === 0 ? (
                    <p className="px-2 text-xs text-black/40">
                      No conversations yet.
                    </p>
                  ) : null}
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => loadConversationMessages(conv)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-xs transition ${
                        activeConversationId === conv.id
                          ? "border-black bg-black text-white"
                          : "border-black/10 bg-white/85 text-black/80 hover:border-black/25 hover:bg-white"
                      }`}
                    >
                      <p className="mb-1 line-clamp-2 font-medium leading-relaxed">
                        {conv.title || getConversationPreview(conv)}
                      </p>
                      <p className="text-[10px] opacity-55">
                        {new Date(conv.updatedAt).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </aside>

              <div className="flex flex-1 flex-col gap-4">
                <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                  {chatMessages.map((message) => (
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
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
