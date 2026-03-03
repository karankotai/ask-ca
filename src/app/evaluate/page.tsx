"use client";

import { useState } from "react";
import Link from "next/link";

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
      <div className="h-2 w-16 rounded-full bg-zinc-700">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-sm font-semibold">{score}</span>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  return (
    <span
      className={`font-semibold ${
        value > 0
          ? "text-emerald-400"
          : value < 0
            ? "text-red-400"
            : "text-zinc-500"
      }`}
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
          <tr className="border-b border-zinc-700 text-left text-xs uppercase tracking-wide text-zinc-400">
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
              <tr key={crit} className="border-b border-zinc-800">
                <td className="py-3 pr-4 text-zinc-300">{crit}</td>
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

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-zinc-400 hover:text-zinc-200"
      >
        {open ? "Hide" : "Show"} judge reasoning
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          {CRITERIA.map((crit) => (
            <div key={crit} className="rounded-lg bg-[#1a1a1a] p-3">
              <p className="mb-1 text-sm font-medium text-zinc-300">{crit}</p>
              <div className={`grid gap-2 md:grid-cols-${cols}`}>
                <div>
                  <p className="text-xs font-semibold text-emerald-400">RAG</p>
                  <p className="text-xs text-zinc-400">
                    {ragMap[crit]?.reasoning ?? "\u2014"}
                  </p>
                </div>
                {gptMap && (
                  <div>
                    <p className="text-xs font-semibold text-orange-400">GPT</p>
                    <p className="text-xs text-zinc-400">
                      {gptMap[crit]?.reasoning ?? "\u2014"}
                    </p>
                  </div>
                )}
                {gemMap && (
                  <div>
                    <p className="text-xs font-semibold text-blue-400">Gemini</p>
                    <p className="text-xs text-zinc-400">
                      {gemMap[crit]?.reasoning ?? "\u2014"}
                    </p>
                  </div>
                )}
                {custMap && (
                  <div>
                    <p className="text-xs font-semibold text-purple-400">Custom</p>
                    <p className="text-xs text-zinc-400">
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
      <div className="mb-3 flex gap-2">
        <button
          onClick={() => setTab("rag")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "rag"
              ? "bg-emerald-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          RAG Answer
        </button>
        {hasGpt && (
          <button
            onClick={() => setTab("gpt")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "gpt"
                ? "bg-orange-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            GPT Answer
          </button>
        )}
        {hasGemini && (
          <button
            onClick={() => setTab("gemini")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "gemini"
                ? "bg-blue-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Gemini Answer
          </button>
        )}
        {hasCustom && (
          <button
            onClick={() => setTab("custom")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "custom"
                ? "bg-purple-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Custom Answer
          </button>
        )}
      </div>
      <div className="rounded-lg bg-[#1a1a1a] p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
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
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        RAG Retrieved Sources
      </p>
      <div className="flex flex-col gap-2">
        {sources.map((src, j) => (
          <div key={j} className="rounded-lg bg-[#2f2f2f] px-3 py-2 text-sm">
            <p className="font-medium text-zinc-200">{src.title}</p>
            <p className="text-xs text-zinc-400">
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
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
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
                  className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
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
  return (
    <div className="text-center">
      <p
        className={`text-2xl font-bold ${
          value > 0
            ? "text-emerald-400"
            : value < 0
              ? "text-red-400"
              : "text-zinc-400"
        }`}
      >
        {value > 0 ? "+" : ""}
        {value.toFixed(1)}
      </p>
      <p className="text-xs text-zinc-400">{label}</p>
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
    } catch {
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

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Chat
          </Link>
          <Link
            href="/circulars"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Circulars
          </Link>
          <span className="text-sm font-medium text-white">Evaluate</span>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">RAG Evaluation</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Compare RAG pipeline answers against vanilla LLMs — scored by GPT-4o judge on 5 criteria.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">
              Question
            </label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What are the latest RBI NBFC guidelines?"
              rows={2}
              maxLength={2000}
              className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Ground Truth{" "}
                <span className="text-zinc-500">(optional)</span>
              </label>
              <textarea
                value={groundTruth}
                onChange={(e) => setGroundTruth(e.target.value)}
                placeholder="Reference answer for comparison..."
                rows={2}
                maxLength={5000}
                className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Source Filter{" "}
                <span className="text-zinc-500">(optional)</span>
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
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
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Compare against
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 rounded-xl bg-[#2f2f2f] px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={baselines.includes("gpt")}
                  onChange={() => toggleBaseline("gpt")}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-orange-400 font-medium">GPT</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl bg-[#2f2f2f] px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={baselines.includes("gemini")}
                  onChange={() => toggleBaseline("gemini")}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-blue-400 font-medium">Gemini</span>
              </label>
              <label className="flex items-center gap-2 rounded-xl bg-[#2f2f2f] px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={baselines.includes("custom")}
                  onChange={() => toggleBaseline("custom")}
                  className="h-4 w-4 rounded"
                />
                <span className="text-sm text-purple-400 font-medium">Custom Answer</span>
              </label>
            </div>
          </div>

          {hasCustomBaseline && (
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Custom Answer
              </label>
              <textarea
                value={customAnswer}
                onChange={(e) => setCustomAnswer(e.target.value)}
                placeholder="Paste your custom answer to evaluate against RAG..."
                rows={4}
                maxLength={10000}
                className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-purple-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !question.trim() || baselines.length === 0 || (hasCustomBaseline && !customAnswer.trim())}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
          >
            {loading ? "Evaluating..." : "Run Evaluation"}
          </button>
        </form>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-12">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-zinc-400">
              Running {baselinesLabel} + judge evaluation...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-8">
            {/* Summary header */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#2f2f2f] p-5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-400">Question</p>
                <p className="mt-0.5 font-medium">{result.question}</p>
              </div>
              <div className="flex gap-5 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {result.rag_eval.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">RAG</p>
                </div>
                {hasGpt && (
                  <div>
                    <p className="text-2xl font-bold text-orange-400">
                      {result.vanilla_gpt_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">GPT</p>
                  </div>
                )}
                {hasGemini && (
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {result.vanilla_gemini_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">Gemini</p>
                  </div>
                )}
                {hasCustom && (
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      {result.custom_eval!.average_score.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">Custom</p>
                  </div>
                )}
                {hasGpt && result.rag_advantage_vs_gpt != null && (
                  <div className="border-l border-zinc-700 pl-5">
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

            {/* Score table */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">
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
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <ReasoningPanel
                ragScores={result.rag_eval.scores}
                gptScores={result.vanilla_gpt_eval?.scores ?? null}
                geminiScores={result.vanilla_gemini_eval?.scores ?? null}
                customScores={result.custom_eval?.scores ?? null}
              />
            </div>

            {/* Answers */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">Answers</h2>
              <AnswerComparison result={result} />
            </div>

            {/* Sources */}
            {result.rag_sources.length > 0 && (
              <div className="rounded-xl bg-[#2f2f2f] p-5">
                <SourcesPanel sources={result.rag_sources} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <p className="text-center text-xs text-zinc-600">
          Powered by your RAG pipeline
        </p>
      </div>
    </div>
  );
}
