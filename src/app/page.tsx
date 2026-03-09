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

interface AnalysisSummary {
  id: string;
  title: string;
  createdAt: string;
}

interface SelectedAnalysis {
  id: string;
  title: string;
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SelectedAnalysis | null>(null);
  const [showAnalysisPicker, setShowAnalysisPicker] = useState(false);
  const [analysisList, setAnalysisList] = useState<AnalysisSummary[]>([]);
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
    setAnalysisMode(false);
    setSelectedAnalysis(null);
  }, []);

  const handleOpenAnalysisPicker = useCallback(async () => {
    try {
      const res = await fetch("/api/analyze/history?limit=20");
      const data = await res.json();
      setAnalysisList(
        (data.analyses ?? []).map((a: { id: string; title: string; createdAt: string }) => ({
          id: a.id,
          title: a.title,
          createdAt: a.createdAt,
        }))
      );
      setShowAnalysisPicker(true);
    } catch {}
  }, []);

  const handleSelectAnalysis = useCallback(async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/analyze/${id}`);
      if (!res.ok) return;
      const record = await res.json();
      setSelectedAnalysis({ id, title, text: record.analysisMarkdown ?? record.analysis ?? "" });
      setAnalysisMode(true);
      setMessages([]);
      setActiveSessionId(null);
      setShowAnalysisPicker(false);
    } catch {}
  }, []);

  const handleExitAnalysisMode = useCallback(() => {
    setAnalysisMode(false);
    setSelectedAnalysis(null);
    setMessages([]);
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

    // In analysis mode, skip session creation
    let sessionId = activeSessionId;
    if (!analysisMode && !sessionId) {
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
      let res: Response;
      if (analysisMode && selectedAnalysis) {
        const history = messages.map((m) => ({ role: m.role, content: m.content }));
        res = await fetch("/api/analyze/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis_text: selectedAnalysis.text,
            question,
            history,
          }),
        });
      } else {
        res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        });
      }

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

      // Save to DB after stream completes (skip in analysis mode)
      if (sessionId && !analysisMode) {
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
              href="/analyze"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Analyze
            </Link>
            <Link
              href="/obligations"
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Obligations
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
            {messages.length === 0 && !analysisMode && (
              <div className="flex h-[60vh] flex-col items-center justify-center gap-3">
                <h1 className="text-3xl font-semibold text-zinc-400">
                  Ask CA
                </h1>
                <button
                  onClick={handleOpenAnalysisPicker}
                  className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  or chat with a past analysis
                </button>
              </div>
            )}
            {analysisMode && selectedAnalysis && (
              <div className="mb-4 flex items-center justify-between rounded-lg bg-[#2f2f2f] px-4 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-blue-400">Analysis</span>
                  <span className="truncate text-sm text-zinc-300">{selectedAnalysis.title}</span>
                </div>
                <button
                  onClick={handleExitAnalysisMode}
                  className="ml-3 shrink-0 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
                >
                  Exit
                </button>
              </div>
            )}
            {messages.length === 0 && analysisMode && selectedAnalysis && (
              <div className="flex h-[50vh] items-center justify-center">
                <p className="text-sm text-zinc-500">Ask a question about this analysis</p>
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
              placeholder={analysisMode ? "Ask about this analysis..." : "Ask a question..."}
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
            {analysisMode ? "Chatting with analysis" : "Powered by your RAG pipeline"}
          </p>
        </div>
      </div>

      {/* Analysis picker modal */}
      {showAnalysisPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-lg rounded-xl bg-[#2f2f2f] shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-700 px-5 py-4">
              <h2 className="text-lg font-semibold text-white">Select an Analysis</h2>
              <button
                onClick={() => setShowAnalysisPicker(false)}
                className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {analysisList.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-zinc-500">No analyses found</p>
              )}
              {analysisList.map((a) => (
                <button
                  key={a.id}
                  onClick={() => handleSelectAnalysis(a.id, a.title)}
                  className="w-full rounded-lg px-4 py-3 text-left hover:bg-zinc-600/50 transition-colors"
                >
                  <p className="text-sm font-medium text-zinc-200 truncate">{a.title || "Untitled Analysis"}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {new Date(a.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
