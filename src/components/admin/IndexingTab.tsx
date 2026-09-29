"use client";

import { useState } from "react";
import { LoadingPlaceholder, ErrorBox } from "./shared";

export default function IndexingTab() {
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

  const stats: [string, unknown][] = result
    ? [
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
      ]
    : [];

  return (
    <div className="admin-stack">
      <label className="admin-checkcard">
        <input
          type="checkbox"
          checked={forceReindex}
          onChange={(e) => setForceReindex(e.target.checked)}
        />
        <span>Force Reindex</span>
      </label>

      <button
        type="button"
        onClick={handleIndex}
        disabled={loading}
        className="btn btn-primary"
      >
        {loading ? "Indexing..." : "Run Indexing"}
      </button>

      {loading && (
        <div className="admin-loading">
          <span className="admin-loading-text">
            Indexing documents... this may take a few minutes.
          </span>
        </div>
      )}

      {result && (
        <div className="admin-success">
          <h3 className="admin-success-title">Indexing Results</h3>
          <div className="admin-stat-grid cols-3">
            {stats.map(([label, value]) => (
              <div key={label as string} className="admin-stat-card">
                <p className="admin-stat-label">{label as string}</p>
                <p className="admin-stat-value">
                  {String(value ?? "\u2014")}
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
