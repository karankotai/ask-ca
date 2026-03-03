"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";
import ChatSidebar from "@/components/ChatSidebar";

interface Source {
  title: string;
  source: string;
  date: string;
  link: string;
  circular_number: string;
  relevance_score: number;
  pdf_links: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface SessionSummary {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch sessions on mount
  useEffect(() => {
    fetch("/api/chat/sessions")
      .then((r) => r.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 200) + "px";
    }
  }, [input]);

  const handleSelectSession = useCallback(async (id: number) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      if (!res.ok) return;
      const session = await res.json();
      setActiveSessionId(id);
      setMessages(
        session.messages.map((m: { role: string; content: string; sources: Source[] }) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
          sources: m.sources ?? [],
        }))
      );
    } catch {}
  }, []);

  const handleNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setInput("");
  }, []);

  const handleDeleteSession = useCallback(
    async (id: number) => {
      try {
        await fetch(`/api/chat/sessions/${id}`, { method: "DELETE" });
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeSessionId === id) {
          setActiveSessionId(null);
          setMessages([]);
        }
      } catch {}
    },
    [activeSessionId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    // Create session lazily on first message
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const res = await fetch("/api/chat/sessions", { method: "POST" });
        const session = await res.json();
        sessionId = session.id;
        setActiveSessionId(sessionId);
        setSessions((prev) => [
          { id: session.id, title: "", createdAt: session.createdAt, updatedAt: session.updatedAt },
          ...prev,
        ]);
      } catch {
        // Continue without persistence if session creation fails
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Bad response");
      }

      // Add an empty assistant message that we'll stream into
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", sources: [] },
      ]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";
      let streamedSources: Source[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const match = line.match(/^data:\s*(.+)$/m);
          if (!match) continue;

          const event = JSON.parse(match[1]);

          if (event.type === "sources") {
            streamedSources = event.data.sources ?? [];
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                sources: streamedSources,
              };
              return updated;
            });
          } else if (event.type === "token") {
            streamedContent += event.data;
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              updated[updated.length - 1] = {
                ...last,
                content: last.content + event.data,
              };
              return updated;
            });
          }
        }
      }

      // Save to DB after stream completes
      if (sessionId) {
        const title = question.slice(0, 50);
        fetch(`/api/chat/sessions/${sessionId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userMessage: question,
            assistantMessage: streamedContent,
            sources: streamedSources,
            title,
          }),
        })
          .then(() => {
            // Update session title in sidebar
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sessionId
                  ? { ...s, title: s.title || title, updatedAt: new Date().toISOString() }
                  : s
              )
            );
          })
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content) return prev;
        return [
          ...prev,
          { role: "assistant", content: "Error connecting to RAG service." },
        ];
      });
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <div className="flex h-screen bg-[#212121] text-white">
      {/* Sidebar */}
      <ChatSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        isOpen={sidebarOpen}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Main area */}
      <div className="flex flex-1 flex-col">
        {/* Nav */}
        <nav className="border-b border-zinc-800 px-4 py-3">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-[#2f2f2f] hover:text-white"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <span className="text-sm font-medium text-white">Chat</span>
            <Link
              href="/circulars"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Circulars
            </Link>
            <Link
              href="/evaluate"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Evaluate
            </Link>
            <Link
              href="/admin"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Admin
            </Link>
          </div>
        </nav>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-8">
            {messages.length === 0 && (
              <div className="flex h-[60vh] items-center justify-center">
                <h1 className="text-3xl font-semibold text-zinc-400">
                  Ask CA
                </h1>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-6 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-[#2f2f2f] text-white"
                      : "text-zinc-100"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Markdown content={msg.content} />
                  ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  )}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 border-t border-zinc-700 pt-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                        Sources
                      </p>
                      <div className="flex flex-col gap-2">
                        {msg.sources.map((src, j) => (
                          <div
                            key={j}
                            className="rounded-lg bg-[#2f2f2f] px-3 py-2 text-sm"
                          >
                            <p className="font-medium text-zinc-200">
                              {src.title}
                            </p>
                            <p className="text-xs text-zinc-400">
                              {src.source}
                              {src.date ? ` | ${src.date}` : ""}
                              {src.circular_number
                                ? ` | ${src.circular_number}`
                                : ""}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {src.link && (
                                <a
                                  href={src.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  Circular Link
                                </a>
                              )}
                              {src.pdf_links?.map((pdf, k) => (
                                <a
                                  key={k}
                                  href={pdf}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                >
                                  PDF{src.pdf_links.length > 1 ? ` ${k + 1}` : ""}
                                </a>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="mb-6 flex justify-start">
                <div className="flex items-center gap-1 px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-700/50 bg-[#212121] p-4">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-3xl items-end gap-3 rounded-2xl bg-[#2f2f2f] px-4 py-3"
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-white placeholder-zinc-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-zinc-200 disabled:opacity-30 disabled:hover:bg-white"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </form>
          <p className="mt-2 text-center text-xs text-zinc-600">
            Powered by your RAG pipeline
          </p>
        </div>
      </div>
    </div>
  );
}
