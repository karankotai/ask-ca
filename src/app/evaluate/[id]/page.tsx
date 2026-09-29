"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CriterionScore {
  criterion: string;
  score: number;
  reasoning: string;
}

interface Source {
  title: string;
  source: string;
  date: string;
  link: string;
  circular_number: string;
  relevance_score: number;
  pdf_links: string[];
}

interface EvalRun {
  id: string;
  createdAt: string;
  question: string;
  groundTruth: string | null;
  sourceFilter: string | null;
  ragAnswer: string;
  ragAvgScore: number;
  ragTotalScore: number;
  gptAnswer: string | null;
  gptAvgScore: number | null;
  gptTotalScore: number | null;
  geminiAnswer: string | null;
  geminiAvgScore: number | null;
  geminiTotalScore: number | null;
  customAnswer: string | null;
  customAvgScore: number | null;
  customTotalScore: number | null;
  customScores: CriterionScore[] | null;
  ragAdvantageVsGpt: number | null;
  ragAdvantageVsGemini: number | null;
  ragAdvantageVsCustom: number | null;
  ragScores: CriterionScore[];
  gptScores: CriterionScore[] | null;
  geminiScores: CriterionScore[] | null;
  ragSources: Source[];
}

const LABEL_COLORS: Record<string, string> = {
  rag: "#059669",
  gpt: "#ea580c",
  gemini: "#2563eb",
  custom: "#7c3aed",
};

function evalFillColor(score: number): string {
  if (score >= 4) return "#10b981";
  if (score >= 3) return "#eab308";
  return "#ef4444";
}

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  return (
    <div className="eval-scorebar">
      <div className="eval-scorebar-track">
        <div
          className="eval-scorebar-fill"
          style={{ width: `${pct}%`, background: evalFillColor(score) }}
        />
      </div>
      <span className="eval-scorebar-score">{score}</span>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const cls =
    value > 0 ? "eval-delta-pos" : value < 0 ? "eval-delta-neg" : "eval-delta-zero";
  return (
    <span className={`eval-delta ${cls}`}>
      {value > 0 ? "+" : ""}
      {value}
    </span>
  );
}

function ScoreTable({
  ragScores,
  gptScores,
  geminiScores,
  customScores,
}: {
  ragScores: CriterionScore[];
  gptScores: CriterionScore[] | null;
  geminiScores: CriterionScore[] | null;
  customScores?: CriterionScore[] | null;
}) {
  const ragMap = Object.fromEntries(ragScores.map((s) => [s.criterion, s]));
  const gptMap = gptScores
    ? Object.fromEntries(gptScores.map((s) => [s.criterion, s]))
    : null;
  const gemMap = geminiScores
    ? Object.fromEntries(geminiScores.map((s) => [s.criterion, s]))
    : null;
  const custMap = customScores
    ? Object.fromEntries(customScores.map((s) => [s.criterion, s]))
    : null;
  const criteria = ragScores.map((s) => s.criterion);

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="eval-table">
        <thead>
          <tr style={{ borderColor: "var(--border)", color: "var(--text-light)" }}>
            <th style={{ textAlign: "left", paddingLeft: 0 }}>Criterion</th>
            <th className="text-center">RAG</th>
            {gptMap && <th className="text-center">GPT</th>}
            {gemMap && <th className="text-center">Gemini</th>}
            {custMap && <th className="text-center">Custom</th>}
            {gptMap && <th className="text-center">vs GPT</th>}
            {gemMap && <th className="text-center">vs Gemini</th>}
            {custMap && <th className="text-center">vs Custom</th>}
          </tr>
        </thead>
        <tbody>
          {criteria.map((crit) => {
            const ragS = ragMap[crit]?.score ?? 0;
            const gptS = gptMap?.[crit]?.score ?? 0;
            const gemS = gemMap?.[crit]?.score ?? 0;
            const custS = custMap?.[crit]?.score ?? 0;
            return (
              <tr key={crit} style={{ borderColor: "var(--border-light)" }}>
                <td className="criterion">{crit}</td>
                <td style={{ textAlign: "center" }}>
                  <ScoreBar score={ragS} />
                </td>
                {gptMap && (
                  <td style={{ textAlign: "center" }}>
                    <ScoreBar score={gptS} />
                  </td>
                )}
                {gemMap && (
                  <td style={{ textAlign: "center" }}>
                    <ScoreBar score={gemS} />
                  </td>
                )}
                {custMap && (
                  <td style={{ textAlign: "center" }}>
                    <ScoreBar score={custS} />
                  </td>
                )}
                {gptMap && (
                  <td style={{ textAlign: "center" }}>
                    <DeltaBadge value={ragS - gptS} />
                  </td>
                )}
                {gemMap && (
                  <td style={{ textAlign: "center" }}>
                    <DeltaBadge value={ragS - gemS} />
                  </td>
                )}
                {custMap && (
                  <td style={{ textAlign: "center" }}>
                    <DeltaBadge value={ragS - custS} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReasoningPanel({
  ragScores,
  gptScores,
  geminiScores,
  customScores,
}: {
  ragScores: CriterionScore[];
  gptScores: CriterionScore[] | null;
  geminiScores: CriterionScore[] | null;
  customScores?: CriterionScore[] | null;
}) {
  const ragMap = Object.fromEntries(ragScores.map((s) => [s.criterion, s]));
  const gptMap = gptScores
    ? Object.fromEntries(gptScores.map((s) => [s.criterion, s]))
    : null;
  const gemMap = geminiScores
    ? Object.fromEntries(geminiScores.map((s) => [s.criterion, s]))
    : null;
  const custMap = customScores
    ? Object.fromEntries(customScores.map((s) => [s.criterion, s]))
    : null;
  const criteria = ragScores.map((s) => s.criterion);
  const cols = 1 + (gptMap ? 1 : 0) + (gemMap ? 1 : 0) + (custMap ? 1 : 0);
  const gridClass = `eval-reasoning-grid cols-${cols}`;

  const colLabelColor = (key: "rag" | "gpt" | "gemini" | "custom") =>
    LABEL_COLORS[key] ?? "var(--text-light)";

  return (
    <div className="eval-reasoning-criteria" style={{ marginTop: 0 }}>
      {criteria.map((crit) => (
        <div key={crit} className="card-soft">
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-dark)",
            }}
          >
            {crit}
          </p>
          <div className={gridClass}>
            <div>
              <p className="eval-reasoning-col-label" style={{ color: colLabelColor("rag") }}>RAG</p>
              <p className="eval-reasoning-col-text">
                {ragMap[crit]?.reasoning ?? "—"}
              </p>
            </div>
            {gptMap && (
              <div>
                <p className="eval-reasoning-col-label" style={{ color: colLabelColor("gpt") }}>GPT</p>
                <p className="eval-reasoning-col-text">
                  {gptMap[crit]?.reasoning ?? "—"}
                </p>
              </div>
            )}
            {gemMap && (
              <div>
                <p className="eval-reasoning-col-label" style={{ color: colLabelColor("gemini") }}>Gemini</p>
                <p className="eval-reasoning-col-text">
                  {gemMap[crit]?.reasoning ?? "—"}
                </p>
              </div>
            )}
            {custMap && (
              <div>
                <p className="eval-reasoning-col-label" style={{ color: colLabelColor("custom") }}>Custom</p>
                <p className="eval-reasoning-col-text">
                  {custMap[crit]?.reasoning ?? "—"}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function AnswerComparison({ run }: { run: EvalRun }) {
  const hasGpt = run.gptAnswer != null;
  const hasGemini = run.geminiAnswer != null;
  const hasCustom = run.customAnswer != null;

  type AnswerTab = "rag" | "gpt" | "gemini" | "custom";
  const [tab, setTab] = useState<AnswerTab>("rag");

  const answer =
    tab === "rag"
      ? run.ragAnswer
      : tab === "gpt"
        ? run.gptAnswer
        : tab === "custom"
          ? run.customAnswer
          : run.geminiAnswer;

  return (
    <div>
      <div className="eval-answer-tabs">
        <button
          onClick={() => setTab("rag")}
          className={`eval-answer-tab ${tab === "rag" ? "selected" : "unselected"}`}
          style={tab === "rag" ? { background: LABEL_COLORS.rag } : undefined}
        >
          RAG Answer
        </button>
        {hasGpt && (
          <button
            onClick={() => setTab("gpt")}
            className={`eval-answer-tab ${tab === "gpt" ? "selected" : "unselected"}`}
            style={tab === "gpt" ? { background: LABEL_COLORS.gpt } : undefined}
          >
            GPT Answer
          </button>
        )}
        {hasGemini && (
          <button
            onClick={() => setTab("gemini")}
            className={`eval-answer-tab ${tab === "gemini" ? "selected" : "unselected"}`}
            style={tab === "gemini" ? { background: LABEL_COLORS.gemini } : undefined}
          >
            Gemini Answer
          </button>
        )}
        {hasCustom && (
          <button
            onClick={() => setTab("custom")}
            className={`eval-answer-tab ${tab === "custom" ? "selected" : "unselected"}`}
            style={tab === "custom" ? { background: LABEL_COLORS.custom } : undefined}
          >
            Custom Answer
          </button>
        )}
      </div>
      <div className="card-soft" style={{ whiteSpace: "pre-wrap" }}>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--text-dark)",
            margin: 0,
          }}
        >
          {answer ?? "Not evaluated"}
        </p>
      </div>
    </div>
  );
}

function SourcesPanel({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div>
      <p
        style={{
          margin: "0 0 8px",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--text-light)",
        }}
      >
        RAG Retrieved Sources
      </p>
      <div className="eval-sources-stack">
        {sources.map((src, j) => (
          <div key={j} className="card-soft">
            <p
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text-dark)",
                margin: "0 0 4px",
              }}
            >
              {src.title}
            </p>
            <p style={{ fontSize: 12, color: "var(--text-mid)", margin: 0 }}>
              {src.source}
              {src.date ? ` | ${src.date}` : ""}
              {src.circular_number ? ` | ${src.circular_number}` : ""}
            </p>
            <div
              style={{
                marginTop: 4,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              {src.link && (
                <a
                  href={src.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "var(--accent)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  Circular Link
                </a>
              )}
              {src.pdf_links?.map((pdf, k) => (
                <a
                  key={k}
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: 12,
                    color: "var(--accent)",
                    textDecoration: "none",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                >
                  PDF{src.pdf_links.length > 1 ? ` ${k + 1}` : ""}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdvantageBadge({ value, label }: { value: number; label: string }) {
  const color =
    value > 0 ? "#059669" : value < 0 ? "#dc2626" : "var(--text-mid)";
  return (
    <div className="eval-stat-box">
      <p className="eval-stat-value" style={{ color }}>
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </p>
      <p className="eval-stat-label">{label}</p>
    </div>
  );
}

function StatBox({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="eval-stat-box">
      <p className="eval-stat-value" style={{ color }}>
        {value.toFixed(1)}
      </p>
      <p className="eval-stat-label">{label}</p>
    </div>
  );
}

export default function EvalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [run, setRun] = useState<EvalRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/evaluate/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load evaluation.");
          return;
        }
        setRun(data.run);
      } catch {
        setError("Could not load evaluation.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const hasGpt = run?.gptAnswer != null;
  const hasGemini = run?.geminiAnswer != null;
  const hasCustom = run?.customAnswer != null;

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <Link
            href="/evaluate"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--text-mid)",
              textDecoration: "none",
              marginBottom: 12,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
            &larr; Back to Evaluations
          </Link>
          <h1 className="page-title">Evaluation detail</h1>
          <p className="page-subtitle">
            {run
              ? `${new Date(run.createdAt).toLocaleString()}${
                  run.sourceFilter ? ` · Source: ${run.sourceFilter}` : ""
                }`
              : "Evaluation report"}
          </p>
        </div>
      </div>

      {loading && (
        <div className="empty-state">Loading evaluation…</div>
      )}

      {error && <div className="eval-error-block">{error}</div>}

      {run && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div className="card">
            <div className="eval-summary-row">
              <div className="eval-summary-question">
                <p className="q-label">Question</p>
                <p className="q-text">{run.question}</p>
                {run.groundTruth && (
                  <>
                    <p className="q-label" style={{ marginTop: 12 }}>Ground Truth</p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: "var(--text-mid)",
                      }}
                    >
                      {run.groundTruth}
                    </p>
                  </>
                )}
              </div>
              <div className="eval-summary-stats">
                <StatBox
                  value={run.ragAvgScore}
                  label="RAG"
                  color={LABEL_COLORS.rag}
                />
                {hasGpt && run.gptAvgScore != null && (
                  <StatBox
                    value={run.gptAvgScore}
                    label="GPT"
                    color={LABEL_COLORS.gpt}
                  />
                )}
                {hasGemini && run.geminiAvgScore != null && (
                  <StatBox
                    value={run.geminiAvgScore}
                    label="Gemini"
                    color={LABEL_COLORS.gemini}
                  />
                )}
                {hasCustom && run.customAvgScore != null && (
                  <StatBox
                    value={run.customAvgScore}
                    label="Custom"
                    color={LABEL_COLORS.custom}
                  />
                )}
                {run.ragAdvantageVsGpt != null && (
                  <div className="eval-advantage-divider">
                    <AdvantageBadge value={run.ragAdvantageVsGpt} label="vs GPT" />
                  </div>
                )}
                {run.ragAdvantageVsGemini != null && (
                  <AdvantageBadge value={run.ragAdvantageVsGemini} label="vs Gemini" />
                )}
                {run.ragAdvantageVsCustom != null && (
                  <AdvantageBadge value={run.ragAdvantageVsCustom} label="vs Custom" />
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="eval-section-title">Score Comparison</h2>
            <ScoreTable
              ragScores={run.ragScores}
              gptScores={run.gptScores}
              geminiScores={run.geminiScores}
              customScores={run.customScores}
            />
          </div>

          <div className="card">
            <h2 className="eval-section-title">Judge Reasoning</h2>
            <ReasoningPanel
              ragScores={run.ragScores}
              gptScores={run.gptScores}
              geminiScores={run.geminiScores}
              customScores={run.customScores}
            />
          </div>

          <div className="card">
            <h2 className="eval-section-title">Answers</h2>
            <AnswerComparison run={run} />
          </div>

          {run.ragSources.length > 0 && (
            <div className="card">
              <SourcesPanel sources={run.ragSources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
