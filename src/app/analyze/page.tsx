"use client";

import { useState, useRef, useEffect, useCallback, Fragment } from "react";
import Markdown from "@/components/Markdown";

type InputMode = "text" | "pdf";

interface HistoryItem {
  id: string;
  createdAt: string;
  title: string;
  inputMode: string;
  fileName: string | null;
}

const historyPageNumbers = (
  historyPage: number,
  historyTotalPages: number,
): (number | "...")[] => {
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

export default function AnalyzePage() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [merge, setMerge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedAnalysis, setExpandedAnalysis] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
    } catch (e) {
      console.error("[analyze] fetchHistory failed", e);
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
    if (inputMode === "pdf" && files.length > 0) {
      for (const f of files) formData.append("file", f);
      if (merge) formData.append("merge", "true");
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

      if (buffer.trim()) {
        const match = buffer.match(/^data:\s*(.+)$/m);
        if (match) {
          try {
            const event = JSON.parse(match[1]);
            if (event.type === "token") {
              fullAnalysis += event.data;
              setAnalysis((prev) => prev + event.data);
            }
          } catch {
            // ignore malformed trailing data
          }
        }
      }

      if (fullAnalysis) {
        fetch("/api/analyze/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:
              files.length > 0
                ? files.map((f) => f.name).join(", ")
                : text.trim().slice(0, 80),
            inputMode,
            fileName: files[0]?.name ?? null,
            analysis: fullAnalysis,
          }),
        }).then(() => fetchHistory(1));
      }
    } catch (e) {
      console.error("[analyze] submit failed", e);
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
    } catch (e) {
      console.error("[analyze] row fetch failed", e);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === "application/pdf" || f.name.endsWith(".pdf"),
    );
    if (dropped.length > 0) {
      setFiles((prev) => [...prev, ...dropped]);
    }
  }

  const goToHistoryPage = (p: number) => {
    if (p < 1 || p > historyTotalPages) return;
    setHistoryPage(p);
    fetchHistory(p);
  };

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Analyze a circular</div>
          <div className="page-subtitle">
            Paste circular text or upload a PDF to get a structured CA analysis.
          </div>
        </div>
      </div>

      <div className="cal-view-toggle" style={{ marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => setInputMode("text")}
          className={inputMode === "text" ? "active" : ""}
        >
          Text Input
        </button>
        <button
          type="button"
          onClick={() => setInputMode("pdf")}
          className={inputMode === "pdf" ? "active" : ""}
        >
          PDF Upload
        </button>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 28 }}>
        {inputMode === "text" ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the full circular text here..."
            rows={12}
            className="advisory-textarea"
            style={{
              background: "var(--bg-main)",
              border: "1px solid var(--border)",
              minHeight: 200,
            }}
          />
        ) : (
          <div className="space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 16px",
                borderRadius: "var(--radius-lg)",
                border: "2px dashed var(--border)",
                background: "var(--bg-main)",
                cursor: "pointer",
                transition: "all 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--accent-light)";
                e.currentTarget.style.background = "var(--accent-bg)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.background = "var(--bg-main)";
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                onChange={(e) => {
                  const incoming = e.target.files;
                  if (!incoming) return;
                  const pdfs = Array.from(incoming).filter(
                    (f) =>
                      f.type === "application/pdf" || f.name.endsWith(".pdf"),
                  );
                  setFiles((prev) => [...prev, ...pdfs]);
                  e.target.value = "";
                }}
                style={{ display: "none" }}
              />
              {files.length === 0 ? (
                <>
                  <p style={{ fontSize: 13, color: "var(--text-mid)" }}>
                    Drop PDF files here or click to browse
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-light)", marginTop: 4 }}>
                    Multiple .pdf files accepted
                  </p>
                </>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-mid)" }}>
                  Click or drop to add more files
                </p>
              )}
            </div>

            {files.length > 0 && (
              <div className="client-list-card" style={{ marginTop: 12 }}>
                {files.map((f, i) => (
                  <div
                    key={`${f.name}-${i}`}
                    className="client-list-item"
                    style={{ cursor: "default" }}
                  >
                    <div className="top">
                      <div>
                        <div className="name">{f.name}</div>
                        <div className="meta">
                          {(f.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFiles((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        style={{
                          fontSize: 11,
                          color: "var(--danger)",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          fontWeight: 500,
                          fontFamily: "inherit",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {files.length > 1 && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "4px 2px",
                  cursor: "pointer",
                }}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={merge}
                  onClick={() => setMerge((v) => !v)}
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    height: 24,
                    width: 44,
                    flexShrink: 0,
                    borderRadius: 999,
                    background: merge
                      ? "linear-gradient(135deg, var(--accent), var(--accent-light))"
                      : "var(--border)",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.12s",
                  }}
                >
                  <span
                    style={{
                      pointerEvents: "none",
                      display: "inline-block",
                      position: "absolute",
                      top: 2,
                      left: 2,
                      height: 20,
                      width: 20,
                      borderRadius: "50%",
                      background: "#fff",
                      transition: "transform 0.15s ease",
                      transform: merge ? "translateX(20px)" : "translateX(0)",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                    }}
                  />
                </button>
                <span style={{ fontSize: 12, color: "var(--text-mid)" }}>
                  Merge into single document (for amendments)
                </span>
              </label>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "12px 14px",
              borderRadius: "var(--radius)",
              background: "var(--danger-bg)",
              color: "var(--danger)",
              fontSize: 12,
              fontWeight: 500,
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 16,
          }}
        >
          <button
            type="submit"
            disabled={
              loading ||
              (inputMode === "text" && !text.trim()) ||
              (inputMode === "pdf" && files.length === 0)
            }
            className="btn btn-primary"
          >
            {loading ? "Analyzing…" : "Analyze Circular"}
          </button>
          {loading && (
            <span style={{ fontSize: 12, color: "var(--text-light)" }}>
              Streaming response…
            </span>
          )}
        </div>
      </form>

      {analysis && (
        <div className="card ai-card" style={{ marginBottom: 32, position: "relative" }}>
          <button
            type="button"
            onClick={() => handleCopy(analysis)}
            title="Copy analysis"
            className="btn btn-outline"
            style={{
              position: "absolute",
              right: 20,
              top: 20,
              padding: "6px 10px",
              fontSize: 11,
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <div className="ai-card-header">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: "var(--accent)" }}
            >
              <path d="M12 2v4" />
              <path d="m16.2 7.8 2.9-2.9" />
              <path d="M18 12h4" />
              <path d="m16.2 16.2 2.9 2.9" />
              <path d="M12 18v4" />
              <path d="m4.9 19.1 2.9-2.9" />
              <path d="M2 12h4" />
              <path d="m4.9 4.9 2.9 2.9" />
            </svg>
            <span>AI Analysis</span>
          </div>
          <div className="ai-card-body" style={{ paddingTop: 4 }}>
            <Markdown content={analysis} variant="light" />
          </div>
        </div>
      )}

      <div className="section-heading" style={{ marginBottom: 14 }}>
        Past Analyses
      </div>

      {historyLoading && !history.length ? (
        <div className="empty-state">Loading history…</div>
      ) : history.length === 0 ? (
        <div className="empty-state">
          No analyses yet. Submit a circular using the form above, and past results will appear here.
        </div>
      ) : (
        <>
          <div className="card" style={{ padding: 0, marginBottom: 16 }}>
            <table className="list-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Input Type</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <Fragment key={item.id}>
                    <tr
                      onClick={() => handleRowClick(item.id)}
                      style={{ cursor: "pointer" }}
                    >
                      <td style={{ color: "var(--text-mid)", whiteSpace: "nowrap" }}>
                        {new Date(item.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="client">
                        {item.title || "Untitled"}
                      </td>
                      <td>
                        <span
                          className={`tag ${
                            item.inputMode === "pdf" ? "tag-gstn" : "tag-default"
                          }`}
                          style={{ textTransform: "none", letterSpacing: 0 }}
                        >
                          {item.inputMode === "pdf" ? "PDF" : "Text"}
                        </span>
                      </td>
                    </tr>
                    {expandedId === item.id && (
                      <tr>
                        <td colSpan={3} style={{ background: "var(--bg-main)", padding: "16px 18px" }}>
                          {expandedAnalysis === null ? (
                            <div className="empty-state" style={{ padding: "20px 0" }}>
                              Loading…
                            </div>
                          ) : (
                            <div style={{ position: "relative" }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopy(expandedAnalysis);
                                }}
                                title="Copy analysis"
                                className="btn btn-outline"
                                style={{
                                  position: "absolute",
                                  right: 0,
                                  top: 0,
                                  padding: "4px 8px",
                                  fontSize: 11,
                                  zIndex: 1,
                                }}
                              >
                                {copied ? "Copied!" : "Copy"}
                              </button>
                              <div style={{ paddingTop: 28 }}>
                                <Markdown content={expandedAnalysis} variant="light" />
                              </div>
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

          {historyTotalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                paddingBottom: 8,
              }}
            >
              <button
                type="button"
                onClick={() => goToHistoryPage(historyPage - 1)}
                disabled={historyPage === 1}
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Prev
              </button>

              {historyPageNumbers(historyPage, historyTotalPages).map((p, i) =>
                p === "..." ? (
                  <span
                    key={`e${i}`}
                    style={{
                      padding: "0 6px",
                      fontSize: 12,
                      color: "var(--text-light)",
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => goToHistoryPage(p)}
                    className={`btn ${
                      p === historyPage
                        ? "btn-primary"
                        : "btn-outline"
                    }`}
                    style={{
                      padding: "6px 12px",
                      fontSize: 12,
                      minWidth: 34,
                      justifyContent: "center",
                    }}
                  >
                    {p}
                  </button>
                ),
              )}

              <button
                type="button"
                onClick={() => goToHistoryPage(historyPage + 1)}
                disabled={historyPage === historyTotalPages}
                className="btn btn-outline"
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
