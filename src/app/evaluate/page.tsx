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

function ScoreBar({ score, max = 5 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color =
    score >= 4 ? "bg-emerald-500" : score >= 3 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 w-16 rounded-full"
        style={{ background: "var(--border)" }}
      >
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-sm font-semibold" style={{ color: "var(--text-dark)" }}>{score}</span>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  return (
    <span
      className={`font-semibold ${
        value > 0
          ? "text-emerald-500"
          : value < 0
            ? "text-red-500"
            : ""
      }`}
      style={value === 0 ? { color: "var(--text-light)" } : undefined}
    >
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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr
            className="border-b text-left text-xs uppercase tracking-wide"
            style={{ borderColor: "var(--border)", color: "var(--text-light)" }}
          >
            <th className="py-2 pr-4">Criterion</th>
            <th className="px-3 py-2 text-center">RAG</th>
            {gptMap && <th className="px-3 py-2 text-center">GPT</th>}
            {gemMap && <th className="px-3 py-2 text-center">Gemini</th>}
            {custMap && <th className="px-3 py-2 text-center">Custom</th>}
            {gptMap && <th className="px-2 py-2 text-center">vs GPT</th>}
            {gemMap && <th className="px-2 py-2 text-center">vs Gemini</th>}
            {custMap && <th className="py-2 pl-2 text-center">vs Custom</th>}
          </tr>
        </thead>
        <tbody>
          {CRITERIA.map((crit) => {
            const ragS = ragMap[crit]?.score ?? 0;
            const gptS = gptMap?.[crit]?.score ?? 0;
            const gemS = gemMap?.[crit]?.score ?? 0;
            const custS = custMap?.[crit]?.score ?? 0;
            return (
              <tr key={crit} className="border-b" style={{ borderColor: "var(--border-light)" }}>
                <td className="py-3 pr-4" style={{ color: "var(--text-dark)" }}>{crit}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-center">
                    <ScoreBar score={ragS} />
                  </div>
                </td>
                {gptMap && (
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <ScoreBar score={gptS} />
                    </div>
                  </td>
                )}
                {gemMap && (
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <ScoreBar score={gemS} />
                    </div>
                  </td>
                )}
                {custMap && (
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <ScoreBar score={custS} />
                    </div>
                  </td>
                )}
                {gptMap && (
                  <td className="px-2 py-3 text-center">
                    <DeltaBadge value={ragS - gptS} />
                  </td>
                )}
                {gemMap && (
                  <td className="px-2 py-3 text-center">
                    <DeltaBadge value={ragS - gemS} />
                  </td>
                )}
                {custMap && (
                  <td className="py-3 pl-2 text-center">
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

  let gridClass: string;
  switch (cols) {
    case 1:
      gridClass = "grid gap-2 md:grid-cols-1";
      break;
    case 2:
      gridClass = "grid gap-2 md:grid-cols-2";
      break;
    case 3:
      gridClass = "grid gap-2 md:grid-cols-3";
      break;
    case 4:
    default:
      gridClass = "grid gap-2 md:grid-cols-4";
      break;
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm hover:underline"
        style={{ color: "var(--text-mid)" }}
      >
        {open ? "Hide" : "Show"} judge reasoning
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {CRITERIA.map((crit) => (
            <div key={crit} className="card-soft">
              <p className="mb-1 text-sm font-medium" style={{ color: "var(--text-dark)" }}>{crit}</p>
              <div className={gridClass}>
                <div>
                  <p className="text-xs font-semibold text-emerald-600">RAG</p>
                  <p className="text-xs" style={{ color: "var(--text-mid)" }}>
                    {ragMap[crit]?.reasoning ?? "\u2014"}
                  </p>
                </div>
                {gptMap && (
                  <div>
                    <p className="text-xs font-semibold text-orange-600">GPT</p>
                    <p className="text-xs" style={{ color: "var(--text-mid)" }}>
                      {gptMap[crit]?.reasoning ?? "\u2014"}
                    </p>
                  </div>
                )}
                {gemMap && (
                  <div>
                    <p className="text-xs font-semibold text-blue-600">Gemini</p>
                    <p className="text-xs" style={{ color: "var(--text-mid)" }}>
                      {gemMap[crit]?.reasoning ?? "\u2014"}
                    </p>
                  </div>
                )}
                {custMap && (
                  <div>
                    <p className="text-xs font-semibold text-purple-600">Custom</p>
                    <p className="text-xs" style={{ color: "var(--text-mid)" }}>
                      {custMap[crit]?.reasoning ?? "\u2014"}
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
      <div className="mb-3">
        <div className="channel-toggle">
          <button
            onClick={() => setTab("rag")}
            className={tab === "rag" ? "active" : ""}
          >
            RAG Answer
          </button>
          {hasGpt && (
            <button
              onClick={() => setTab("gpt")}
              className={tab === "gpt" ? "active" : ""}
            >
              GPT Answer
            </button>
          )}
          {hasGemini && (
            <button
              onClick={() => setTab("gemini")}
              className={tab === "gemini" ? "active" : ""}
            >
              Gemini Answer
            </button>
          )}
          {hasCustom && (
            <button
              onClick={() => setTab("custom")}
              className={tab === "custom" ? "active" : ""}
            >
              Custom Answer
            </button>
          )}
        </div>
      </div>
      <div
        className="card-soft whitespace-pre-wrap"
      >
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-dark)" }}>
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-light)" }}>
        RAG Retrieved Sources
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((src, j) => (
          <div key={j} className="card-soft">
            <p className="font-medium text-sm" style={{ color: "var(--text-dark)" }}>{src.title}</p>
            <p className="text-xs" style={{ color: "var(--text-mid)" }}>
              {src.source}
              {src.date ? ` | ${src.date}` : ""}
              {src.circular_number ? ` | ${src.circular_number}` : ""}
            </p>
            <div className="mt-1 flex flex-wrap gap-2">
              {src.link && (
                <a
                  href={src.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:underline hover:text-indigo-700"
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
                  className="text-xs text-indigo-600 hover:underline hover:text-indigo-700"
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
  const textColor = value > 0
    ? "#059669"
    : value < 0
      ? "#dc2626"
      : "var(--text-mid)";
  return (
    <div className="text-center">
      <p
        className="text-2xl font-bold"
        style={{ color: textColor }}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </p>
      <p className="text-xs" style={{ color: "var(--text-light)" }}>{label}</p>
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
  };

  const inputFocusStyle: React.CSSProperties = {
    ...inputBaseStyle,
  };

  const inputProps = {
    style: inputFocusStyle,
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
    <div className="screen" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <h1 className="page-title">RAG Evaluation</h1>
          <p className="page-subtitle">
            Compare RAG pipeline answers against vanilla LLMs — scored by GPT-4o judge on 5 criteria.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-dark)" }}>
            Question
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What are the latest RBI NBFC guidelines?"
            rows={2}
            maxLength={2000}
            {...inputProps}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-dark)" }}>
              Ground Truth{" "}
              <span style={{ color: "var(--text-light)" }}>(optional)</span>
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
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-dark)" }}>
              Source Filter{" "}
              <span style={{ color: "var(--text-light)" }}>(optional)</span>
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

        {/* Baselines toggle */}
        <div>
          <label className="mb-2 block text-sm font-medium" style={{ color: "var(--text-dark)" }}>
            Compare against
          </label>
          <div className="flex gap-4 flex-wrap">
            <label className={`flex items-center gap-2 btn ${baselines.includes("gpt") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("gpt")}
                onChange={() => toggleBaseline("gpt")}
                className="hidden"
              />
              <span className="text-sm font-medium">GPT</span>
            </label>
            <label className={`flex items-center gap-2 btn ${baselines.includes("gemini") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("gemini")}
                onChange={() => toggleBaseline("gemini")}
                className="hidden"
              />
              <span className="text-sm font-medium">Gemini</span>
            </label>
            <label className={`flex items-center gap-2 btn ${baselines.includes("custom") ? "btn-primary" : "btn-outline"}`}>
              <input
                type="checkbox"
                checked={baselines.includes("custom")}
                onChange={() => toggleBaseline("custom")}
                className="hidden"
              />
              <span className="text-sm font-medium">Custom Answer</span>
            </label>
          </div>
        </div>

        {hasCustomBaseline && (
          <div>
            <label className="mb-1 block text-sm font-medium" style={{ color: "var(--text-dark)" }}>
              Custom Answer
            </label>
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

        <button
          type="submit"
          disabled={loading || !question.trim() || baselines.length === 0 || (hasCustomBaseline && !customAnswer.trim())}
          className="btn btn-primary"
        >
          {loading ? "Evaluating..." : "Run Evaluation"}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <p className="text-sm" style={{ color: "var(--text-mid)" }}>
            Running {baselinesLabel} + judge evaluation...
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-xl"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "12px 14px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-8">
          {/* Summary header */}
          <div className="card">
            <div className="flex flex-wrap items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm" style={{ color: "var(--text-light)" }}>Question</p>
                <p className="mt-0.5 font-medium" style={{ color: "var(--text-dark)" }}>{result.question}</p>
              </div>
              <div className="flex gap-5 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-600">
                    {result.rag_eval.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-light)" }}>RAG</p>
                </div>
                {hasGpt && (
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {result.vanilla_gpt_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-light)" }}>GPT</p>
                  </div>
                )}
                {hasGemini && (
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {result.vanilla_gemini_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-light)" }}>Gemini</p>
                  </div>
                )}
                {hasCustom && (
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {result.custom_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-light)" }}>Custom</p>
                  </div>
                )}
                {hasGpt && result.rag_advantage_vs_gpt != null && (
                  <div className="border-l pl-5" style={{ borderColor: "var(--border)" }}>
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

          {/* Score table */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-dark)" }}>
              Score Comparison
            </h2>
            <ScoreTable
              ragScores={result.rag_eval.scores}
              gptScores={result.vanilla_gpt_eval?.scores ?? null}
              geminiScores={result.vanilla_gemini_eval?.scores ?? null}
              customScores={result.custom_eval?.scores ?? null}
            />
          </div>

          {/* Judge reasoning */}
          <div className="card">
            <ReasoningPanel
              ragScores={result.rag_eval.scores}
              gptScores={result.vanilla_gpt_eval?.scores ?? null}
              geminiScores={result.vanilla_gemini_eval?.scores ?? null}
              customScores={result.custom_eval?.scores ?? null}
            />
          </div>

          {/* Answers */}
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--text-dark)" }}>Answers</h2>
            <AnswerComparison result={result} />
          </div>

          {/* Sources */}
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
