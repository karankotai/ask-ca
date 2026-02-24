"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────

interface CriterionScore {
  criterion: string;
  score: number;
  reasoning: string;
}

interface EvalRunRecord {
  id: string;
  createdAt: string;
  question: string;
  groundTruth: string | null;
  sourceFilter: string | null;
  ragAnswer: string;
  ragAvgScore: number;
  ragTotalScore: number;
  vanillaAnswer: string;
  vanillaAvgScore: number;
  vanillaTotalScore: number;
  ragAdvantage: number;
  ragScores: CriterionScore[];
  vanillaScores: CriterionScore[];
  ragSources: unknown[];
}

type Tab = "scraping" | "indexing" | "evaluate" | "reports";

const SOURCES = ["all", "rbi", "sebi", "mca", "irdai", "egazette"];
const FORMATS = ["both", "json", "csv"];

// ── Shared Components ────────────────────────────────────────

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
      {message}
    </div>
  );
}

// ── Scraping Tab ─────────────────────────────────────────────

function ScrapingTab() {
  const [source, setSource] = useState("all");
  const [maxPages, setMaxPages] = useState(50);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [format, setFormat] = useState("both");
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Poll for crawl status
  useEffect(() => {
    if (!taskId || status === "completed" || status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/crawl/${taskId}`);
        const data = await res.json();
        setStatus(data.status);
        setRecordCount(data.record_count ?? null);
        if (data.status === "completed" || data.status === "failed") {
          setLoading(false);
          if (data.error) setError(data.error);
        }
      } catch {
        setError("Lost connection while polling.");
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [taskId, status]);

  async function handleStart() {
    setLoading(true);
    setError(null);
    setTaskId(null);
    setStatus(null);
    setRecordCount(null);

    try {
      const res = await fetch("/api/admin/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          max_pages: maxPages,
          deep_crawl: deepCrawl,
          output_format: format,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start crawl.");
        setLoading(false);
        return;
      }

      setTaskId(data.task_id);
      setStatus("running");
    } catch {
      setError("Could not connect to backend.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Source
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-white outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Max Pages
          </label>
          <input
            type="number"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            min={1}
            max={500}
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-white outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Output Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-white outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {FORMATS.map((f) => (
              <option key={f} value={f}>
                {f.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 rounded-xl bg-[#2f2f2f] px-4 py-3">
            <input
              type="checkbox"
              checked={deepCrawl}
              onChange={(e) => setDeepCrawl(e.target.checked)}
              className="h-4 w-4 rounded"
            />
            <span className="text-sm text-zinc-300">
              Deep Crawl (follow links, extract full content)
            </span>
          </label>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={loading}
        className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
      >
        {loading ? "Crawling..." : "Start Crawl"}
      </button>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-[#2f2f2f] p-4">
          <LoadingDots />
          <span className="text-sm text-zinc-400">
            Crawling {source.toUpperCase()}...
            {recordCount !== null && ` (${recordCount} records so far)`}
          </span>
        </div>
      )}

      {status === "completed" && (
        <div className="rounded-xl bg-emerald-900/30 px-4 py-3 text-sm text-emerald-300">
          Crawl completed. {recordCount} records collected.
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}

// ── Indexing Tab ──────────────────────────────────────────────

function IndexingTab() {
  const [forceReindex, setForceReindex] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleIndex() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/admin/index", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force_reindex: forceReindex }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Indexing failed.");
        return;
      }

      setResult(data);
    } catch {
      setError("Could not connect to backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <label className="flex items-center gap-3 rounded-xl bg-[#2f2f2f] px-4 py-3">
        <input
          type="checkbox"
          checked={forceReindex}
          onChange={(e) => setForceReindex(e.target.checked)}
          className="h-4 w-4 rounded"
        />
        <span className="text-sm text-zinc-300">Force Reindex</span>
      </label>

      <button
        onClick={handleIndex}
        disabled={loading}
        className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
      >
        {loading ? "Indexing..." : "Run Indexing"}
      </button>

      {loading && (
        <div className="flex items-center gap-3 rounded-xl bg-[#2f2f2f] p-4">
          <LoadingDots />
          <span className="text-sm text-zinc-400">
            Indexing documents... this may take a few minutes.
          </span>
        </div>
      )}

      {result && (
        <div className="rounded-xl bg-[#2f2f2f] p-5">
          <h3 className="mb-3 text-sm font-semibold text-zinc-300">
            Indexing Results
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Total Records", result.total_records],
              ["With Content", result.records_with_content],
              ["Total Chunks", result.total_chunks],
              ["Vectors Stored", result.total_vectors_stored],
              [
                "Sources",
                Array.isArray(result.sources_indexed)
                  ? (result.sources_indexed as string[]).join(", ")
                  : result.sources_indexed,
              ],
              [
                "Duration",
                typeof result.duration_seconds === "number"
                  ? `${(result.duration_seconds as number).toFixed(1)}s`
                  : result.duration_seconds,
              ],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg bg-[#1a1a1a] p-3">
                <p className="text-xs text-zinc-500">{label as string}</p>
                <p className="text-lg font-semibold text-white">
                  {String(value ?? "—")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}

// ── Evaluate Tab ─────────────────────────────────────────────

function EvaluateTab() {
  const [question, setQuestion] = useState("");
  const [groundTruth, setGroundTruth] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { question: q };
      if (groundTruth.trim()) body.ground_truth = groundTruth.trim();
      if (sourceFilter.trim()) body.source_filter = sourceFilter.trim();

      const res = await fetch("/api/admin/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Evaluation failed.");
        return;
      }

      setResult(data.result);
    } catch {
      setError("Could not connect to evaluation service.");
    } finally {
      setLoading(false);
    }
  }

  const r = result as {
    question: string;
    rag_eval: { average_score: number; scores: CriterionScore[] };
    vanilla_eval: { average_score: number; scores: CriterionScore[] };
    rag_advantage: number;
  } | null;

  return (
    <div className="space-y-6">
      <form onSubmit={handleEvaluate} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-300">
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What are the latest RBI NBFC guidelines?"
            rows={2}
            className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Ground Truth <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              value={groundTruth}
              onChange={(e) => setGroundTruth(e.target.value)}
              placeholder="Reference answer for comparison..."
              rows={2}
              className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Source Filter <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              placeholder="e.g. RBI, SEBI, IRDAI, MCA"
              className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
        >
          {loading ? "Evaluating..." : "Run & Save"}
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <LoadingDots />
          <p className="text-sm text-zinc-400">
            Running RAG + vanilla LLM + judge evaluation...
          </p>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {r && (
        <div className="rounded-xl bg-[#2f2f2f] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="flex-1">
              <p className="text-sm text-zinc-400">Question</p>
              <p className="mt-0.5 font-medium">{r.question}</p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {r.rag_eval.average_score.toFixed(1)}
                </p>
                <p className="text-xs text-zinc-400">RAG</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-400">
                  {r.vanilla_eval.average_score.toFixed(1)}
                </p>
                <p className="text-xs text-zinc-400">Vanilla</p>
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${
                    r.rag_advantage > 0
                      ? "text-emerald-400"
                      : r.rag_advantage < 0
                        ? "text-red-400"
                        : "text-zinc-400"
                  }`}
                >
                  {r.rag_advantage > 0 ? "+" : ""}
                  {r.rag_advantage.toFixed(1)}
                </p>
                <p className="text-xs text-zinc-400">Advantage</p>
              </div>
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">Criterion</th>
                <th className="px-4 py-2 text-center">RAG</th>
                <th className="px-4 py-2 text-center">Vanilla</th>
                <th className="py-2 pl-4 text-center">Delta</th>
              </tr>
            </thead>
            <tbody>
              {r.rag_eval.scores.map((rs: CriterionScore, i: number) => {
                const vs = r.vanilla_eval.scores[i];
                const delta = rs.score - (vs?.score ?? 0);
                return (
                  <tr key={rs.criterion} className="border-b border-zinc-800">
                    <td className="py-2 pr-4 text-zinc-300">{rs.criterion}</td>
                    <td className="px-4 py-2 text-center">{rs.score}</td>
                    <td className="px-4 py-2 text-center">
                      {vs?.score ?? "—"}
                    </td>
                    <td className="py-2 pl-4 text-center">
                      <span
                        className={`font-semibold ${
                          delta > 0
                            ? "text-emerald-400"
                            : delta < 0
                              ? "text-red-400"
                              : "text-zinc-500"
                        }`}
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Reports Tab ──────────────────────────────────────────────

function ReportsTab() {
  const [runs, setRuns] = useState<EvalRunRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/evaluate/history");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load history.");
        return;
      }
      setRuns(data.runs ?? []);
    } catch {
      setError("Could not load evaluation history.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingDots />
      </div>
    );
  }

  if (error) return <ErrorBox message={error} />;

  if (runs.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-zinc-500">
        No evaluations yet. Run one in the Evaluate tab.
      </p>
    );
  }

  // Summary stats
  const totalEvals = runs.length;
  const avgRag = runs.reduce((s, r) => s + r.ragAvgScore, 0) / totalEvals;
  const avgVanilla =
    runs.reduce((s, r) => s + r.vanillaAvgScore, 0) / totalEvals;
  const avgAdvantage =
    runs.reduce((s, r) => s + r.ragAdvantage, 0) / totalEvals;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Evals", totalEvals.toString(), "text-white"],
          ["Avg RAG Score", avgRag.toFixed(2), "text-emerald-400"],
          ["Avg Vanilla Score", avgVanilla.toFixed(2), "text-orange-400"],
          [
            "Avg Advantage",
            (avgAdvantage > 0 ? "+" : "") + avgAdvantage.toFixed(2),
            avgAdvantage > 0
              ? "text-emerald-400"
              : avgAdvantage < 0
                ? "text-red-400"
                : "text-zinc-400",
          ],
        ].map(([label, value, color]) => (
          <div key={label} className="rounded-xl bg-[#2f2f2f] p-4">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* History table */}
      <div className="overflow-x-auto rounded-xl bg-[#2f2f2f]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-700 text-left text-xs uppercase tracking-wide text-zinc-400">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Question</th>
              <th className="px-4 py-3 text-center">RAG</th>
              <th className="px-4 py-3 text-center">Vanilla</th>
              <th className="px-4 py-3 text-center">Advantage</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <>
                <tr
                  key={run.id}
                  className="cursor-pointer border-b border-zinc-800 transition-colors hover:bg-zinc-800/50"
                  onClick={() =>
                    setExpanded(expanded === run.id ? null : run.id)
                  }
                >
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-400">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-200">
                    {run.question}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-emerald-400">
                    {run.ragAvgScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-orange-400">
                    {run.vanillaAvgScore.toFixed(1)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-semibold ${
                        run.ragAdvantage > 0
                          ? "text-emerald-400"
                          : run.ragAdvantage < 0
                            ? "text-red-400"
                            : "text-zinc-500"
                      }`}
                    >
                      {run.ragAdvantage > 0 ? "+" : ""}
                      {run.ragAdvantage.toFixed(1)}
                    </span>
                  </td>
                </tr>

                {expanded === run.id && (
                  <tr key={`${run.id}-detail`} className="border-b border-zinc-800">
                    <td colSpan={5} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500">
                          Per-Criterion Scores
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {(run.ragScores as CriterionScore[]).map(
                            (rs, i) => {
                              const vs = (
                                run.vanillaScores as CriterionScore[]
                              )[i];
                              return (
                                <div
                                  key={rs.criterion}
                                  className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2"
                                >
                                  <span className="text-sm text-zinc-300">
                                    {rs.criterion}
                                  </span>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-emerald-400">
                                      RAG: {rs.score}
                                    </span>
                                    <span className="text-orange-400">
                                      Van: {vs?.score ?? "—"}
                                    </span>
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                        {run.sourceFilter && (
                          <p className="text-xs text-zinc-500">
                            Source filter: {run.sourceFilter}
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("scraping");

  const tabs: { key: Tab; label: string }[] = [
    { key: "scraping", label: "Scraping" },
    { key: "indexing", label: "Indexing" },
    { key: "evaluate", label: "Evaluate" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Chat
          </Link>
          <Link
            href="/evaluate"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Evaluate
          </Link>
          <span className="text-sm font-medium text-white">Admin</span>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage scraping, indexing, evaluations, and view reports.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "scraping" && <ScrapingTab />}
        {tab === "indexing" && <IndexingTab />}
        {tab === "evaluate" && <EvaluateTab />}
        {tab === "reports" && <ReportsTab />}
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
