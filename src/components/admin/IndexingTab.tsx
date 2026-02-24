"use client";

import { useState } from "react";
import { LoadingDots, ErrorBox } from "./shared";

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
