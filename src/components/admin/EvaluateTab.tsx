"use client";

import { useState } from "react";
import { LoadingPlaceholder, ErrorBox, CriterionScore } from "./shared";
import Link from "next/link";

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

export default function EvaluateTab() {
  const [question, setQuestion] = useState("");
  const [groundTruth, setGroundTruth] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [baselines, setBaselines] = useState<string[]>(["gpt", "gemini"]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleBaseline(b: string) {
    setBaselines((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  async function handleEvaluate(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading || baselines.length === 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = { question: q, baselines };
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
    vanilla_gpt_eval: { average_score: number; scores: CriterionScore[] } | null;
    vanilla_gemini_eval: { average_score: number; scores: CriterionScore[] } | null;
    rag_advantage_vs_gpt: number | null;
    rag_advantage_vs_gemini: number | null;
    eval_run_id?: string;
  } | null;

  const hasGpt = r?.vanilla_gpt_eval != null;
  const hasGemini = r?.vanilla_gemini_eval != null;

  const baselinesLabel = [
    "RAG",
    ...(baselines.includes("gpt") ? ["GPT"] : []),
    ...(baselines.includes("gemini") ? ["Gemini"] : []),
  ].join(" + ");

  return (
    <div className="admin-stack">
      <form onSubmit={handleEvaluate} className="admin-stack" style={{ gap: 16 }}>
        <div>
          <label className="admin-label">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What are the latest RBI NBFC guidelines?"
            rows={2}
            maxLength={2000}
            className="admin-textarea"
          />
        </div>

        <div className="admin-grid cols-2-md">
          <div>
            <label className="admin-label">
              Ground Truth <span className="hint">(optional)</span>
            </label>
            <textarea
              value={groundTruth}
              onChange={(e) => setGroundTruth(e.target.value)}
              placeholder="Reference answer for comparison..."
              rows={2}
              maxLength={5000}
              className="admin-textarea"
            />
          </div>
          <div>
            <label className="admin-label">
              Source Filter <span className="hint">(optional)</span>
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">All sources</option>
              <option value="rbi">RBI</option>
              <option value="sebi">SEBI</option>
              <option value="mca">MCA</option>
              <option value="irdai">IRDAI</option>
              <option value="egazette">e-Gazette</option>
            </select>
          </div>
        </div>

        <div>
          <label className="admin-label">Compare against</label>
          <div className="admin-baseline-row">
            <label className="admin-baseline-card">
              <input
                type="checkbox"
                checked={baselines.includes("gpt")}
                onChange={() => toggleBaseline("gpt")}
              />
              <span style={{ color: COLORS.gpt, fontWeight: 500 }}>GPT</span>
            </label>
            <label className="admin-baseline-card">
              <input
                type="checkbox"
                checked={baselines.includes("gemini")}
                onChange={() => toggleBaseline("gemini")}
              />
              <span style={{ color: COLORS.gemini, fontWeight: 500 }}>Gemini</span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim() || baselines.length === 0}
          className="btn btn-primary"
        >
          {loading ? "Evaluating..." : "Run & Save"}
        </button>
      </form>

      {loading && (
        <div className="empty-state">
          Running {baselinesLabel} + judge evaluation...
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {r && (
        <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="admin-summary">
            <div className="admin-summary-q">
              <p className="admin-summary-q-label">Question</p>
              <p className="admin-summary-q-text">{r.question}</p>
            </div>
            <div className="admin-summary-stats">
              <div className="admin-stat-box">
                <div className="admin-stat-box-value" style={{ color: COLORS.rag }}>
                  {r.rag_eval.average_score.toFixed(1)}
                </div>
                <div className="admin-stat-box-label">RAG</div>
              </div>
              {hasGpt && (
                <div className="admin-stat-box">
                  <div className="admin-stat-box-value" style={{ color: COLORS.gpt }}>
                    {r.vanilla_gpt_eval!.average_score.toFixed(1)}
                  </div>
                  <div className="admin-stat-box-label">GPT</div>
                </div>
              )}
              {hasGemini && (
                <div className="admin-stat-box">
                  <div className="admin-stat-box-value" style={{ color: COLORS.gemini }}>
                    {r.vanilla_gemini_eval!.average_score.toFixed(1)}
                  </div>
                  <div className="admin-stat-box-label">Gemini</div>
                </div>
              )}
              {r.rag_advantage_vs_gpt != null && (
                <div className="admin-stat-box admin-divider">
                  <div
                    className="admin-stat-box-value"
                    style={{ color: advantageClass(r.rag_advantage_vs_gpt) }}
                  >
                    {r.rag_advantage_vs_gpt > 0 ? "+" : ""}
                    {r.rag_advantage_vs_gpt.toFixed(1)}
                  </div>
                  <div className="admin-stat-box-label">vs GPT</div>
                </div>
              )}
              {r.rag_advantage_vs_gemini != null && (
                <div className="admin-stat-box admin-divider">
                  <div
                    className="admin-stat-box-value"
                    style={{ color: advantageClass(r.rag_advantage_vs_gemini) }}
                  >
                    {r.rag_advantage_vs_gemini > 0 ? "+" : ""}
                    {r.rag_advantage_vs_gemini.toFixed(1)}
                  </div>
                  <div className="admin-stat-box-label">vs Gemini</div>
                </div>
              )}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Criterion</th>
                  <th className="center">RAG</th>
                  {hasGpt && <th className="center">GPT</th>}
                  {hasGemini && <th className="center">Gemini</th>}
                  {hasGpt && <th className="center">vs GPT</th>}
                  {hasGemini && <th className="center">vs Gemini</th>}
                </tr>
              </thead>
              <tbody>
                {r.rag_eval.scores.map((rs: CriterionScore, i: number) => {
                  const gs = r.vanilla_gpt_eval?.scores[i];
                  const ges = r.vanilla_gemini_eval?.scores[i];
                  const dGpt = rs.score - (gs?.score ?? 0);
                  const dGem = rs.score - (ges?.score ?? 0);
                  return (
                    <tr key={rs.criterion} style={{ cursor: "default" }}>
                      <td>{rs.criterion}</td>
                      <td className="center">{rs.score}</td>
                      {hasGpt && <td className="center">{gs?.score ?? "\u2014"}</td>}
                      {hasGemini && <td className="center">{ges?.score ?? "\u2014"}</td>}
                      {hasGpt && (
                        <td className="center">
                          <span
                            style={{
                              fontWeight: 600,
                              color: advantageClass(dGpt),
                            }}
                          >
                            {dGpt > 0 ? "+" : ""}
                            {dGpt}
                          </span>
                        </td>
                      )}
                      {hasGemini && (
                        <td className="center">
                          <span
                            style={{
                              fontWeight: 600,
                              color: advantageClass(dGem),
                            }}
                          >
                            {dGem > 0 ? "+" : ""}
                            {dGem}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {r.eval_run_id && (
            <Link
              href={`/evaluate/${r.eval_run_id}`}
              className="admin-view-link btn btn-outline"
            >
              View full evaluation details
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
