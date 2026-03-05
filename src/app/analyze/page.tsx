"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import Markdown from "@/components/Markdown";

type InputMode = "text" | "pdf";

interface HistoryItem {
  id: string;
  createdAt: string;
  title: string;
  inputMode: string;
  fileName: string | null;
}

export default function AnalyzePage() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // History state
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);

  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/analyze/history?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.analyses);
        setHistoryPage(data.page);
        setHistoryTotalPages(data.totalPages);
      }
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const formData = new FormData();
    if (inputMode === "pdf" && file) {
      formData.append("file", file);
    } else if (inputMode === "text" && text.trim()) {
      formData.append("text", text.trim());
    } else {
      setError("Please provide circular text or upload a PDF.");
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis("");

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Analysis failed.");
        setLoading(false);
        return;
      }

      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullAnalysis = "";

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

          if (event.type === "token") {
            fullAnalysis += event.data;
            setAnalysis((prev) => prev + event.data);
          }
        }
      }

      // Save analysis after stream completes
      if (fullAnalysis) {
        fetch("/api/analyze/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: file?.name || text.trim().slice(0, 80),
            inputMode,
            fileName: file?.name ?? null,
            analysis: fullAnalysis,
          }),
        }).then(() => fetchHistory(1));
      }
    } catch {
      setError("Could not connect to analysis service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRowClick(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedAnalysis(null);
      return;
    }
    setExpandedId(id);
    setExpandedAnalysis(null);
    try {
      const res = await fetch(`/api/analyze/${id}`);
      const data = await res.json();
      if (res.ok) {
        setExpandedAnalysis(data.analysis);
      }
    } catch {
      // silent
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type === "application/pdf") {
      setFile(dropped);
    }
  }

  const goToHistoryPage = (p: number) => {
    if (p < 1 || p > historyTotalPages) return;
    setHistoryPage(p);
    fetchHistory(p);
  };

  const historyPageNumbers = (): (number | "...")[] => {
    if (historyTotalPages <= 7)
      return Array.from({ length: historyTotalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (historyPage > 3) pages.push("...");
    for (
      let i = Math.max(2, historyPage - 1);
      i <= Math.min(historyTotalPages - 1, historyPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (historyPage < historyTotalPages - 2) pages.push("...");
    pages.push(historyTotalPages);
    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            Chat
          </Link>
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
          <span className="text-sm font-medium text-white">Analyze</span>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Circular Analysis</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paste circular text or upload a PDF to get a structured CA analysis.
          </p>
        </div>

        {/* Input toggle */}
        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setInputMode("text")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              inputMode === "text"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Text
          </button>
          <button
            onClick={() => setInputMode("pdf")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              inputMode === "pdf"
                ? "bg-white text-black"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            PDF
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          {inputMode === "text" ? (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full circular text here..."
              rows={12}
              className="mb-4 w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          ) : (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 bg-[#2f2f2f] px-4 py-12 transition-colors hover:border-zinc-500"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {file ? (
                <p className="text-sm text-zinc-200">{file.name}</p>
              ) : (
                <>
                  <p className="text-sm text-zinc-400">
                    Drop a PDF here or click to browse
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Only .pdf files accepted
                  </p>
                </>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              (inputMode === "text" && !text.trim()) ||
              (inputMode === "pdf" && !file)
            }
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
          >
            {loading ? "Analyzing..." : "Analyze Circular"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-1 py-8">
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
          </div>
        )}

        {/* Results */}
        {analysis && (
          <div className="mb-10 rounded-xl bg-[#2f2f2f] p-5">
            <Markdown content={analysis} />
          </div>
        )}

        {/* History */}
        <div className="mt-4">
          <h2 className="mb-4 text-lg font-semibold">Past Analyses</h2>

          {historyLoading && !history.length ? (
            <p className="text-sm text-zinc-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-zinc-500">No analyses yet.</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Title
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Input Type
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((item) => (
                      <Fragment key={item.id}>
                        <tr
                          onClick={() => handleRowClick(item.id)}
                          className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-[#2f2f2f]"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                            {new Date(item.createdAt).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-zinc-200">
                            {item.title || "Untitled"}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                item.inputMode === "pdf"
                                  ? "bg-orange-900/40 text-orange-300"
                                  : "bg-blue-900/40 text-blue-300"
                              }`}
                            >
                              {item.inputMode === "pdf" ? "PDF" : "Text"}
                            </span>
                          </td>
                        </tr>
                        {expandedId === item.id && (
                          <tr>
                            <td
                              colSpan={3}
                              className="bg-[#1a1a1a] px-4 py-4"
                            >
                              {expandedAnalysis === null ? (
                                <p className="text-sm text-zinc-500">
                                  Loading...
                                </p>
                              ) : (
                                <div className="max-h-96 overflow-y-auto rounded-lg bg-[#2f2f2f] p-4">
                                  <Markdown content={expandedAnalysis} />
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyTotalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-1">
                  <button
                    onClick={() => goToHistoryPage(historyPage - 1)}
                    disabled={historyPage === 1}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Prev
                  </button>

                  {historyPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`e${i}`}
                        className="px-2 text-sm text-zinc-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToHistoryPage(p)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          p === historyPage
                            ? "bg-white text-black"
                            : "text-zinc-400 hover:bg-[#2f2f2f] hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToHistoryPage(historyPage + 1)}
                    disabled={historyPage === historyTotalPages}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <p className="text-center text-xs text-zinc-600">
          Powered by your RAG pipeline
        </p>
      </div>
    </div>
  );
}
