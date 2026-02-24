"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LoadingDots, ErrorBox, CriterionScore, EvalRunRecord } from "./shared";

export default function ReportsTab() {
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

  // Summary stats — null-safe: only average over runs that have each baseline
  const totalEvals = runs.length;
  const avgRag = runs.reduce((s, r) => s + r.ragAvgScore, 0) / totalEvals;

  const gptRuns = runs.filter((r) => r.gptAvgScore != null);
  const avgGpt = gptRuns.length > 0
    ? gptRuns.reduce((s, r) => s + r.gptAvgScore!, 0) / gptRuns.length
    : null;

  const geminiRuns = runs.filter((r) => r.geminiAvgScore != null);
  const avgGemini = geminiRuns.length > 0
    ? geminiRuns.reduce((s, r) => s + r.geminiAvgScore!, 0) / geminiRuns.length
    : null;

  const gptAdvRuns = runs.filter((r) => r.ragAdvantageVsGpt != null);
  const avgAdvVsGpt = gptAdvRuns.length > 0
    ? gptAdvRuns.reduce((s, r) => s + r.ragAdvantageVsGpt!, 0) / gptAdvRuns.length
    : null;

  const geminiAdvRuns = runs.filter((r) => r.ragAdvantageVsGemini != null);
  const avgAdvVsGemini = geminiAdvRuns.length > 0
    ? geminiAdvRuns.reduce((s, r) => s + r.ragAdvantageVsGemini!, 0) / geminiAdvRuns.length
    : null;

  const summaryCards: [string, string, string][] = [
    ["Total Evals", totalEvals.toString(), "text-white"],
    ["Avg RAG", avgRag.toFixed(2), "text-emerald-400"],
  ];
  if (avgGpt != null) {
    summaryCards.push(["Avg GPT", avgGpt.toFixed(2), "text-orange-400"]);
  }
  if (avgGemini != null) {
    summaryCards.push(["Avg Gemini", avgGemini.toFixed(2), "text-blue-400"]);
  }
  if (avgAdvVsGpt != null) {
    summaryCards.push([
      "Avg vs GPT",
      (avgAdvVsGpt > 0 ? "+" : "") + avgAdvVsGpt.toFixed(2),
      avgAdvVsGpt > 0 ? "text-emerald-400" : avgAdvVsGpt < 0 ? "text-red-400" : "text-zinc-400",
    ]);
  }
  if (avgAdvVsGemini != null) {
    summaryCards.push([
      "Avg vs Gemini",
      (avgAdvVsGemini > 0 ? "+" : "") + avgAdvVsGemini.toFixed(2),
      avgAdvVsGemini > 0 ? "text-emerald-400" : avgAdvVsGemini < 0 ? "text-red-400" : "text-zinc-400",
    ]);
  }

  // Determine which columns the history table needs
  const anyGpt = runs.some((r) => r.gptAvgScore != null);
  const anyGemini = runs.some((r) => r.geminiAvgScore != null);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {summaryCards.map(([label, value, color]) => (
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
              <th className="px-3 py-3 text-center">RAG</th>
              {anyGpt && <th className="px-3 py-3 text-center">GPT</th>}
              {anyGemini && <th className="px-3 py-3 text-center">Gemini</th>}
              {anyGpt && <th className="px-2 py-3 text-center">vs GPT</th>}
              {anyGemini && <th className="py-3 pl-2 text-center">vs Gemini</th>}
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
                  <td className="px-3 py-3 text-center font-semibold text-emerald-400">
                    {run.ragAvgScore.toFixed(1)}
                  </td>
                  {anyGpt && (
                    <td className="px-3 py-3 text-center font-semibold text-orange-400">
                      {run.gptAvgScore != null ? run.gptAvgScore.toFixed(1) : "\u2014"}
                    </td>
                  )}
                  {anyGemini && (
                    <td className="px-3 py-3 text-center font-semibold text-blue-400">
                      {run.geminiAvgScore != null ? run.geminiAvgScore.toFixed(1) : "\u2014"}
                    </td>
                  )}
                  {anyGpt && (
                    <td className="px-2 py-3 text-center">
                      {run.ragAdvantageVsGpt != null ? (
                        <span
                          className={`font-semibold ${
                            run.ragAdvantageVsGpt > 0
                              ? "text-emerald-400"
                              : run.ragAdvantageVsGpt < 0
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {run.ragAdvantageVsGpt > 0 ? "+" : ""}
                          {run.ragAdvantageVsGpt.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">{"\u2014"}</span>
                      )}
                    </td>
                  )}
                  {anyGemini && (
                    <td className="py-3 pl-2 text-center">
                      {run.ragAdvantageVsGemini != null ? (
                        <span
                          className={`font-semibold ${
                            run.ragAdvantageVsGemini > 0
                              ? "text-emerald-400"
                              : run.ragAdvantageVsGemini < 0
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {run.ragAdvantageVsGemini > 0 ? "+" : ""}
                          {run.ragAdvantageVsGemini.toFixed(1)}
                        </span>
                      ) : (
                        <span className="text-zinc-600">{"\u2014"}</span>
                      )}
                    </td>
                  )}
                </tr>

                {expanded === run.id && (
                  <tr key={`${run.id}-detail`} className="border-b border-zinc-800">
                    <td colSpan={3 + (anyGpt ? 2 : 0) + (anyGemini ? 2 : 0)} className="px-4 py-4">
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500">
                          Per-Criterion Scores
                        </p>
                        <div className="grid gap-2 md:grid-cols-2">
                          {(run.ragScores as CriterionScore[]).map(
                            (rs, i) => {
                              const gs = run.gptScores
                                ? (run.gptScores as CriterionScore[])[i]
                                : null;
                              const ges = run.geminiScores
                                ? (run.geminiScores as CriterionScore[])[i]
                                : null;
                              return (
                                <div
                                  key={rs.criterion}
                                  className="flex items-center justify-between rounded-lg bg-[#1a1a1a] px-3 py-2"
                                >
                                  <span className="text-sm text-zinc-300">
                                    {rs.criterion}
                                  </span>
                                  <div className="flex gap-3 text-sm">
                                    <span className="text-emerald-400">
                                      RAG: {rs.score}
                                    </span>
                                    {gs && (
                                      <span className="text-orange-400">
                                        GPT: {gs.score}
                                      </span>
                                    )}
                                    {ges && (
                                      <span className="text-blue-400">
                                        Gem: {ges.score}
                                      </span>
                                    )}
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
                        <Link
                          href={`/evaluate/${run.id}`}
                          className="inline-block rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-600"
                        >
                          View full details &rarr;
                        </Link>
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
