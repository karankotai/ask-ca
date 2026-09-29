"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";
import { LoadingPlaceholder, ErrorBox, CriterionScore, EvalRunRecord } from "./shared";

const COLORS = {
  rag: "#10b981",
  gpt: "#f97316",
  gemini: "#3b82f6",
  danger: "#ef4444",
  neutral: "#6b7280",
} as const;

function advantageClass(d: number | null | undefined) {
  if (d == null) return COLORS.neutral;
  if (d > 0) return COLORS.rag;
  if (d < 0) return COLORS.danger;
  return COLORS.neutral;
}

interface SummaryCard {
  label: string;
  value: string;
  color: string;
}

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
      <div className="admin-loading-inline">
        <LoadingPlaceholder message="Loading reports…" />
      </div>
    );
  }

  if (error) return <ErrorBox message={error} />;

  if (runs.length === 0) {
    return (
      <div className="admin-empty">
        No evaluations yet. Run one in the Evaluate tab.
      </div>
    );
  }

  const totalEvals = runs.length;
  const avgRag = runs.reduce((s, r) => s + r.ragAvgScore, 0) / totalEvals;

  const gptRuns = runs.filter((r) => r.gptAvgScore != null);
  const avgGpt =
    gptRuns.length > 0
      ? gptRuns.reduce((s, r) => s + r.gptAvgScore!, 0) / gptRuns.length
      : null;

  const geminiRuns = runs.filter((r) => r.geminiAvgScore != null);
  const avgGemini =
    geminiRuns.length > 0
      ? geminiRuns.reduce((s, r) => s + r.geminiAvgScore!, 0) / geminiRuns.length
      : null;

  const gptAdvRuns = runs.filter((r) => r.ragAdvantageVsGpt != null);
  const avgAdvVsGpt =
    gptAdvRuns.length > 0
      ? gptAdvRuns.reduce((s, r) => s + r.ragAdvantageVsGpt!, 0) / gptAdvRuns.length
      : null;

  const geminiAdvRuns = runs.filter((r) => r.ragAdvantageVsGemini != null);
  const avgAdvVsGemini =
    geminiAdvRuns.length > 0
      ? geminiAdvRuns.reduce((s, r) => s + r.ragAdvantageVsGemini!, 0) / geminiAdvRuns.length
      : null;

  const summaryCards: SummaryCard[] = [
    { label: "Total Evals", value: totalEvals.toString(), color: "var(--text-dark)" },
    { label: "Avg RAG", value: avgRag.toFixed(2), color: COLORS.rag },
  ];
  if (avgGpt != null) {
    summaryCards.push({
      label: "Avg GPT",
      value: avgGpt.toFixed(2),
      color: COLORS.gpt,
    });
  }
  if (avgGemini != null) {
    summaryCards.push({
      label: "Avg Gemini",
      value: avgGemini.toFixed(2),
      color: COLORS.gemini,
    });
  }
  if (avgAdvVsGpt != null) {
    summaryCards.push({
      label: "Avg vs GPT",
      value: (avgAdvVsGpt > 0 ? "+" : "") + avgAdvVsGpt.toFixed(2),
      color: advantageClass(avgAdvVsGpt),
    });
  }
  if (avgAdvVsGemini != null) {
    summaryCards.push({
      label: "Avg vs Gemini",
      value: (avgAdvVsGemini > 0 ? "+" : "") + avgAdvVsGemini.toFixed(2),
      color: advantageClass(avgAdvVsGemini),
    });
  }

  const anyGpt = runs.some((r) => r.gptAvgScore != null);
  const anyGemini = runs.some((r) => r.geminiAvgScore != null);

  const baseColspan = 3 + (anyGpt ? 2 : 0) + (anyGemini ? 2 : 0);

  return (
    <div className="admin-stack">
      <div className="admin-grid cols-2-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="admin-stat-card">
            <p className="admin-stat-label">{c.label}</p>
            <p className="admin-stat-value" style={{ color: c.color }}>
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Question</th>
              <th className="center">RAG</th>
              {anyGpt && <th className="center">GPT</th>}
              {anyGemini && <th className="center">Gemini</th>}
              {anyGpt && <th className="center">vs GPT</th>}
              {anyGemini && <th className="center">vs Gemini</th>}
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <Fragment key={run.id}>
                <tr onClick={() => setExpanded(expanded === run.id ? null : run.id)}>
                  <td className="td-light">
                    {new Date(run.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 280 }}>
                    {run.question}
                  </td>
                  <td className="center td-semibold" style={{ color: COLORS.rag }}>
                    {run.ragAvgScore.toFixed(1)}
                  </td>
                  {anyGpt && (
                    <td className="center td-semibold" style={{ color: COLORS.gpt }}>
                      {run.gptAvgScore != null ? run.gptAvgScore.toFixed(1) : "\u2014"}
                    </td>
                  )}
                  {anyGemini && (
                    <td className="center td-semibold" style={{ color: COLORS.gemini }}>
                      {run.geminiAvgScore != null ? run.geminiAvgScore.toFixed(1) : "\u2014"}
                    </td>
                  )}
                  {anyGpt && (
                    <td className="center">
                      {run.ragAdvantageVsGpt != null ? (
                        <span
                          style={{
                            fontWeight: 600,
                            color: advantageClass(run.ragAdvantageVsGpt),
                          }}
                        >
                          {run.ragAdvantageVsGpt > 0 ? "+" : ""}
                          {run.ragAdvantageVsGpt.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>{"\u2014"}</span>
                      )}
                    </td>
                  )}
                  {anyGemini && (
                    <td className="center">
                      {run.ragAdvantageVsGemini != null ? (
                        <span
                          style={{
                            fontWeight: 600,
                            color: advantageClass(run.ragAdvantageVsGemini),
                          }}
                        >
                          {run.ragAdvantageVsGemini > 0 ? "+" : ""}
                          {run.ragAdvantageVsGemini.toFixed(1)}
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-light)" }}>{"\u2014"}</span>
                      )}
                    </td>
                  )}
                </tr>

                {expanded === run.id && (
                  <tr style={{ cursor: "default" }}>
                    <td colSpan={baseColspan}>
                      <div className="admin-expanded">
                        <p className="admin-expanded-label">Per-Criterion Scores</p>
                        <div className="admin-expanded-grid">
                          {(run.ragScores as CriterionScore[]).map((rs, i) => {
                            const gs = run.gptScores
                              ? (run.gptScores as CriterionScore[])[i]
                              : null;
                            const ges = run.geminiScores
                              ? (run.geminiScores as CriterionScore[])[i]
                              : null;
                            return (
                              <div key={rs.criterion} className="admin-expanded-row">
                                <span className="admin-expanded-name">{rs.criterion}</span>
                                <div className="admin-expanded-scores">
                                  <span style={{ color: COLORS.rag }}>
                                    RAG: {rs.score}
                                  </span>
                                  {gs && (
                                    <span style={{ color: COLORS.gpt }}>
                                      GPT: {gs.score}
                                    </span>
                                  )}
                                  {ges && (
                                    <span style={{ color: COLORS.gemini }}>
                                      Gem: {ges.score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {run.sourceFilter && (
                          <p style={{ fontSize: 11, color: "var(--text-mid)", margin: 0 }}>
                            Source filter: {run.sourceFilter}
                          </p>
                        )}
                        <Link
                          href={`/evaluate/${run.id}`}
                          className="admin-view-link btn btn-outline"
                        >
                          View full details
                        </Link>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
