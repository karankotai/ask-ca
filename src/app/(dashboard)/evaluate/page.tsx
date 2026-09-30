"use client";

import { useState } from "react";

interface CriterionScore {
  criterion: string;
  score: number;
  reasoning: string;
}

interface SingleAnswerEval {
  answer: string;
  scores: CriterionScore[];
  total_score: number;
  average_score: number;
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

interface QuestionEvalResult {
  question: string;
  ground_truth: string | null;
  rag_eval: SingleAnswerEval;
  vanilla_gpt_eval: SingleAnswerEval | null;
  vanilla_gemini_eval: SingleAnswerEval | null;
  custom_eval: SingleAnswerEval | null;
  rag_sources: Source[];
  rag_advantage_vs_gpt: number | null;
  rag_advantage_vs_gemini: number | null;
  rag_advantage_vs_custom: number | null;
}

const CRITERIA = [
  "Factual Accuracy",
  "Obligation Extraction",
  "Deadline Accuracy",
  "Hallucination Rate",
  "Nuance Handling",
];

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

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="eval-table">
        <thead>
          <tr style={{ borderColor: "var(--border)", color: "var(--text-light)" }}>
            <th className="text-center" style={{ textAlign: "left", paddingLeft: 0 }}>Criterion</th>
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
          {CRITERIA.map((crit) => {
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
  const [open, setOpen] = useState(false);
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

  const cols = 1 + (gptMap ? 1 : 0) + (gemMap ? 1 : 0) + (custMap ? 1 : 0);
  const gridClass = `eval-reasoning-grid cols-${cols}`;

  const colLabelColor = (key: "rag" | "gpt" | "gemini" | "custom") =>
    LABEL_COLORS[key] ?? "var(--text-light)";

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          fontSize: 13,
          color: "var(--text-mid)",
          cursor: "pointer",
          textDecoration: "none",
          fontFamily: "inherit",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
        onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
      >
        {open ? "Hide" : "Show"} judge reasoning
      </button>
      {open && (
        <div className="eval-reasoning-criteria">
          {CRITERIA.map((crit) => (
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
      )}
    </div>
  );
}

function AnswerComparison({ result }: { result: QuestionEvalResult }) {
  const hasGpt = result.vanilla_gpt_eval != null;
  const hasGemini = result.vanilla_gemini_eval != null;
  const hasCustom = result.custom_eval != null;

  type AnswerTab = "rag" | "gpt" | "gemini" | "custom";
  const [tab, setTab] = useState<AnswerTab>("rag");

  const eval_ =
    tab === "rag"
      ? result.rag_eval
      : tab === "gpt"
        ? result.vanilla_gpt_eval
        : tab === "custom"
          ? result.custom_eval
          : result.vanilla_gemini_eval;

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
      <div
        className="card-soft"
        style={{ whiteSpace: "pre-wrap" }}
      >
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--text-dark)",
            margin: 0,
          }}
        >
          {eval_?.answer ?? "Not evaluated"}
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

export default function EvaluatePage() {
  const [question, setQuestion] = useState("");
  const [groundTruth, setGroundTruth] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [baselines, setBaselines] = useState<string[]>(["gpt", "gemini"]);
  const [customAnswer, setCustomAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionEvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleBaseline(b: string) {
    setBaselines((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
  }

  const hasCustomBaseline = baselines.includes("custom");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;
    const llmBaselines = baselines.filter((b) => b !== "custom");
    if (llmBaselines.length === 0 && !hasCustomBaseline) return;
    if (hasCustomBaseline && !customAnswer.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, unknown> = { question: q, baselines: llmBaselines };
      if (groundTruth.trim()) body.ground_truth = groundTruth.trim();
      if (sourceFilter.trim()) body.source_filter = sourceFilter.trim();
      if (hasCustomBaseline && customAnswer.trim()) body.custom_answer = customAnswer.trim();

      const res = await fetch("/api/evaluate", {
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
    } catch (err) {
      console.error("[EvaluatePage] handleSubmit error:", err);
      setError("Could not connect to evaluation service.");
    } finally {
      setLoading(false);
    }
  }

  const hasGpt = result?.vanilla_gpt_eval != null;
  const hasGemini = result?.vanilla_gemini_eval != null;
  const hasCustom = result?.custom_eval != null;

  const baselinesLabel = [
    "RAG",
    ...(baselines.includes("gpt") ? ["GPT"] : []),
    ...(baselines.includes("gemini") ? ["Gemini"] : []),
    ...(baselines.includes("custom") ? ["Custom"] : []),
  ].join(" + ");

  const inputBaseStyle: React.CSSProperties = {
    width: "100%",
    border: "1px solid var(--border)",
    background: "var(--bg-white)",
    color: "var(--text-dark)",
    padding: "10px 14px",
    borderRadius: "var(--radius)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.12s",
    boxSizing: "border-box",
  };

  const inputProps = {
    style: inputBaseStyle,
    onFocus: (e: React.FocusEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = "var(--accent)";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(79, 70, 229, 0.08)";
    },
    onBlur: (e: React.FocusEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
      e.currentTarget.style.borderColor = "var(--border)";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <h1 className="page-title">Evaluate answers</h1>
          <p className="page-subtitle">
            Compare RAG pipeline answers against vanilla LLMs — scored by GPT-4o judge on 5 criteria.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label className="eval-form-label">Question</label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What are the latest RBI NBFC guidelines?"
            rows={2}
            maxLength={2000}
            {...inputProps}
          />
        </div>

        <div className="eval-form-grid">
          <div>
            <label className="eval-form-label">
              Ground Truth<span className="hint">(optional)</span>
            </label>
            <textarea
              value={groundTruth}
              onChange={(e) => setGroundTruth(e.target.value)}
              placeholder="Reference answer for comparison..."
              rows={2}
              maxLength={5000}
              {...inputProps}
            />
          </div>
          <div>
            <label className="eval-form-label">
              Source Filter<span className="hint">(optional)</span>
            </label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              {...inputProps}
            >
              <option value="">All sources</option>
              <option value="rbi">RBI</option>
              <option value="sebi">SEBI</option>
              <option value="mca">MCA</option>
              <option value="irdai">IRDAI</option>
              <option value="egazette">E-Gazette</option>
            </select>
          </div>
        </div>

        <div>
          <label className="eval-form-label">Compare against</label>
          <div className="eval-baseline-row">
            <label className={`btn ${baselines.includes("gpt") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("gpt")}
                onChange={() => toggleBaseline("gpt")}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>GPT</span>
            </label>
            <label className={`btn ${baselines.includes("gemini") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("gemini")}
                onChange={() => toggleBaseline("gemini")}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Gemini</span>
            </label>
            <label className={`btn ${baselines.includes("custom") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("custom")}
                onChange={() => toggleBaseline("custom")}
                style={{ display: "none" }}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>Custom Answer</span>
            </label>
          </div>
        </div>

        {hasCustomBaseline && (
          <div>
            <label className="eval-form-label">Custom Answer</label>
            <textarea
              value={customAnswer}
              onChange={(e) => setCustomAnswer(e.target.value)}
              placeholder="Paste your custom answer to evaluate against RAG..."
              rows={4}
              maxLength={10000}
              {...inputProps}
            />
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={loading || !question.trim() || baselines.length === 0 || (hasCustomBaseline && !customAnswer.trim())}
            className="btn btn-primary"
          >
            {loading ? "Evaluating..." : "Run Evaluation"}
          </button>
        </div>
      </form>

      {loading && (
        <div className="eval-loading-shell">
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-mid)" }}>
            Running {baselinesLabel} + judge evaluation...
          </p>
        </div>
      )}

      {error && <div className="eval-error-block">{error}</div>}

      {result && (
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div className="card">
            <div className="eval-summary-row">
              <div className="eval-summary-question">
                <p className="q-label">Question</p>
                <p className="q-text">{result.question}</p>
              </div>
              <div className="eval-summary-stats">
                <StatBox
                  value={result.rag_eval.average_score}
                  label="RAG"
                  color={LABEL_COLORS.rag}
                />
                {hasGpt && (
                  <StatBox
                    value={result.vanilla_gpt_eval!.average_score}
                    label="GPT"
                    color={LABEL_COLORS.gpt}
                  />
                )}
                {hasGemini && (
                  <StatBox
                    value={result.vanilla_gemini_eval!.average_score}
                    label="Gemini"
                    color={LABEL_COLORS.gemini}
                  />
                )}
                {hasCustom && (
                  <StatBox
                    value={result.custom_eval!.average_score}
                    label="Custom"
                    color={LABEL_COLORS.custom}
                  />
                )}
                {hasGpt && result.rag_advantage_vs_gpt != null && (
                  <div className="eval-advantage-divider">
                    <AdvantageBadge value={result.rag_advantage_vs_gpt} label="vs GPT" />
                  </div>
                )}
                {hasGemini && result.rag_advantage_vs_gemini != null && (
                  <AdvantageBadge value={result.rag_advantage_vs_gemini} label="vs Gemini" />
                )}
                {hasCustom && result.rag_advantage_vs_custom != null && (
                  <AdvantageBadge value={result.rag_advantage_vs_custom} label="vs Custom" />
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="eval-section-title">Score Comparison</h2>
            <ScoreTable
              ragScores={result.rag_eval.scores}
              gptScores={result.vanilla_gpt_eval?.scores ?? null}
              geminiScores={result.vanilla_gemini_eval?.scores ?? null}
              customScores={result.custom_eval?.scores ?? null}
            />
          </div>

          <div className="card">
            <ReasoningPanel
              ragScores={result.rag_eval.scores}
              gptScores={result.vanilla_gpt_eval?.scores ?? null}
              geminiScores={result.vanilla_gemini_eval?.scores ?? null}
              customScores={result.custom_eval?.scores ?? null}
            />
          </div>

          <div className="card">
            <h2 className="eval-section-title">Answers</h2>
            <AnswerComparison result={result} />
          </div>

          {result.rag_sources.length > 0 && (
            <div className="card">
              <SourcesPanel sources={result.rag_sources} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
