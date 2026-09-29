"use client";

import { useState, useEffect, useCallback } from "react";
import { LoadingPlaceholder, ErrorBox } from "./shared";

const SOURCES: { value: string; label: string }[] = [
  { value: "all", label: "All sources" },
  { value: "rbi", label: "RBI" },
  { value: "sebi", label: "SEBI" },
  { value: "mca", label: "MCA" },
  { value: "irdai", label: "IRDAI" },
  { value: "egazette", label: "e-Gazette" },
];

export default function CrawlTab() {
  const [source, setSource] = useState("all");
  const [maxPages, setMaxPages] = useState(50);
  const [offset, setOffset] = useState(0);
  const [deepCrawl, setDeepCrawl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sourceLabel = SOURCES.find((s) => s.value === source)?.label ?? "All sources";

  useEffect(() => {
    if (!taskId || status === "completed" || status === "failed") return;

    const eventSource = new EventSource(`/api/admin/crawl/stream/${taskId}`);

    eventSource.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === "source_complete") {
        setRecordCount(event.data.total_records);
      } else if (event.type === "complete") {
        setStatus("completed");
        setRecordCount(event.data.record_count);
        setLoading(false);
        eventSource.close();
      } else if (event.type === "error") {
        setStatus("failed");
        setError(event.data.message);
        setLoading(false);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setError("Lost connection to crawl stream.");
      setLoading(false);
    };

    return () => eventSource.close();
  }, [taskId, status]);

  const handleStart = useCallback(async () => {
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
          offset,
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
  }, [source, maxPages, deepCrawl, offset]);

  return (
    <div className="admin-stack">
      <div className="admin-grid cols-3">
        <div>
          <label className="admin-label">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="admin-select"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="admin-label">Max Pages</label>
          <input
            type="number"
            value={maxPages}
            onChange={(e) => setMaxPages(Number(e.target.value))}
            min={1}
            max={500}
            className="admin-input"
          />
        </div>
        <div>
          <label className="admin-label">Record Offset</label>
          <input
            type="number"
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            min={0}
            max={10000}
            className="admin-input"
          />
        </div>
      </div>

      <label className="admin-checkcard">
        <input
          type="checkbox"
          checked={deepCrawl}
          onChange={(e) => setDeepCrawl(e.target.checked)}
        />
        <span>Deep Crawl (follow links, extract full content)</span>
      </label>

      <button
        type="button"
        onClick={handleStart}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Crawling..." : "Start Crawl"}
      </button>

      {loading && (
        <div className="admin-loading">
          <span className="admin-loading-text">
            Crawling {sourceLabel}...
            {recordCount !== null && ` (${recordCount} records so far)`}
          </span>
        </div>
      )}

      {status === "completed" && (
        <div className="admin-completed">
          Crawl completed. {recordCount} records collected.
        </div>
      )}

      {error && <ErrorBox message={error} />}
    </div>
  );
}
