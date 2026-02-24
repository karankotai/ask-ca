"use client";

import { useState, useEffect } from "react";
import { LoadingDots, ErrorBox } from "./shared";

const SOURCES = ["all", "rbi", "sebi", "mca", "irdai", "egazette"];
const FORMATS = ["both", "json", "csv"];

export default function ScrapingTab() {
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
