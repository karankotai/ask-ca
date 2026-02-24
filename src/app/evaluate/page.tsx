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
  vanilla_eval: SingleAnswerEval;
  rag_sources: Source[];
  rag_advantage: number;
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
      <div className="h-2 w-20 rounded-full bg-zinc-700">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-5 text-right text-sm font-semibold">{score}</span>
    </div>
  );
}

function ScoreTable({
  ragScores,
  vanillaScores,
}: {
  ragScores: CriterionScore[];
  vanillaScores: CriterionScore[];
}) {
  const ragMap = Object.fromEntries(ragScores.map((s) => [s.criterion, s]));
  const vanMap = Object.fromEntries(vanillaScores.map((s) => [s.criterion, s]));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700 text-left text-xs uppercase tracking-wide text-zinc-400">
            <th className="py-2 pr-4">Criterion</th>
            <th className="px-4 py-2 text-center">RAG</th>
            <th className="px-4 py-2 text-center">Vanilla</th>
            <th className="py-2 pl-4 text-center">Delta</th>
          </tr>
        </thead>
        <tbody>
          {CRITERIA.map((crit) => {
            const ragS = ragMap[crit]?.score ?? 0;
            const vanS = vanMap[crit]?.score ?? 0;
            const delta = ragS - vanS;
            return (
              <tr key={crit} className="border-b border-zinc-800">
                <td className="py-3 pr-4 text-zinc-300">{crit}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ScoreBar score={ragS} />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-center">
                    <ScoreBar score={vanS} />
                  </div>
                </td>
                <td className="py-3 pl-4 text-center">
                  <span
                    className={`font-semibold ${
                      delta > 0
                        ? "text-emerald-400"
                        : delta < 0
                          ? "text-red-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {delta > 0 ? "+" : ""}
                    {delta}
                  </span>
                </td>
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
  vanillaScores,
}: {
  ragScores: CriterionScore[];
  vanillaScores: CriterionScore[];
}) {
  const [open, setOpen] = useState(false);
  const ragMap = Object.fromEntries(ragScores.map((s) => [s.criterion, s]));
  const vanMap = Object.fromEntries(vanillaScores.map((s) => [s.criterion, s]));

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
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold text-emerald-400">RAG</p>
                  <p className="text-xs text-zinc-400">
                    {ragMap[crit]?.reasoning ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-orange-400">
                    Vanilla
                  </p>
                  <p className="text-xs text-zinc-400">
                    {vanMap[crit]?.reasoning ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerComparison({ result }: { result: QuestionEvalResult }) {
  const [tab, setTab] = useState<"rag" | "vanilla">("rag");
  const eval_ = tab === "rag" ? result.rag_eval : result.vanilla_eval;

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
        <button
          onClick={() => setTab("vanilla")}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "vanilla"
              ? "bg-orange-600 text-white"
              : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Vanilla LLM Answer
        </button>
      </div>
      <div className="rounded-lg bg-[#1a1a1a] p-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-200">
          {eval_.answer}
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

export default function EvaluatePage() {
  const [question, setQuestion] = useState("");
  const [groundTruth, setGroundTruth] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuestionEvalResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { question: q };
      if (groundTruth.trim()) body.ground_truth = groundTruth.trim();
      if (sourceFilter.trim()) body.source_filter = sourceFilter.trim();

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

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Chat
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

      <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">RAG Evaluation</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Compare RAG pipeline answers against a vanilla LLM — scored by GPT-4o judge on 5 criteria.
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
                className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">
                Source Filter{" "}
                <span className="text-zinc-500">(optional)</span>
              </label>
              <input
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                placeholder="e.g. RBI, SEBI, IRDAI, MCA"
                className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
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
              Running RAG + vanilla LLM + judge evaluation...
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
              <div className="flex-1">
                <p className="text-sm text-zinc-400">Question</p>
                <p className="mt-0.5 font-medium">{result.question}</p>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {result.rag_eval.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">RAG</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {result.vanilla_eval.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">Vanilla</p>
                </div>
                <div>
                  <p
                    className={`text-2xl font-bold ${
                      result.rag_advantage > 0
                        ? "text-emerald-400"
                        : result.rag_advantage < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {result.rag_advantage > 0 ? "+" : ""}
                    {result.rag_advantage.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">Advantage</p>
                </div>
              </div>
            </div>

            {/* Score table */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">
                Score Comparison
              </h2>
              <ScoreTable
                ragScores={result.rag_eval.scores}
                vanillaScores={result.vanilla_eval.scores}
              />
            </div>

            {/* Judge reasoning */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <ReasoningPanel
                ragScores={result.rag_eval.scores}
                vanillaScores={result.vanilla_eval.scores}
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
