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
  const criteria = ragScores.map((s) => s.criterion);

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
          {criteria.map((crit) => {
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

  return (
    <div className="space-y-3">
      {criteria.map((crit) => (
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
          <Link
            href="/evaluate"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Evaluate
          </Link>
          <Link
            href="/analyze"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Analyze
          </Link>
          <Link
            href="/obligations"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Obligations
          </Link>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Back link */}
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          &larr; Back to Reports
        </Link>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {run && (
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-semibold">Evaluation Detail</h1>
              <p className="mt-1 text-sm text-zinc-400">
                {new Date(run.createdAt).toLocaleString()}
                {run.sourceFilter && ` · Source: ${run.sourceFilter}`}
              </p>
            </div>

            {/* Summary */}
            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-[#2f2f2f] p-5">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-400">Question</p>
                <p className="mt-0.5 font-medium">{run.question}</p>
                {run.groundTruth && (
                  <>
                    <p className="mt-3 text-sm text-zinc-400">Ground Truth</p>
                    <p className="mt-0.5 text-sm text-zinc-300">
                      {run.groundTruth}
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-5 text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">
                    {run.ragAvgScore.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">RAG</p>
                </div>
                {hasGpt && run.gptAvgScore != null && (
                  <div>
                    <p className="text-2xl font-bold text-orange-400">
                      {run.gptAvgScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">GPT</p>
                  </div>
                )}
                {hasGemini && run.geminiAvgScore != null && (
                  <div>
                    <p className="text-2xl font-bold text-blue-400">
                      {run.geminiAvgScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">Gemini</p>
                  </div>
                )}
                {hasCustom && run.customAvgScore != null && (
                  <div>
                    <p className="text-2xl font-bold text-purple-400">
                      {run.customAvgScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-zinc-400">Custom</p>
                  </div>
                )}
                {run.ragAdvantageVsGpt != null && (
                  <div className="border-l border-zinc-700 pl-5">
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

            {/* Score table */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">Score Comparison</h2>
              <ScoreTable
                ragScores={run.ragScores}
                gptScores={run.gptScores}
                geminiScores={run.geminiScores}
                customScores={run.customScores}
              />
            </div>

            {/* Judge reasoning */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">Judge Reasoning</h2>
              <ReasoningPanel
                ragScores={run.ragScores}
                gptScores={run.gptScores}
                geminiScores={run.geminiScores}
                customScores={run.customScores}
              />
            </div>

            {/* Answers */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h2 className="mb-4 text-lg font-semibold">Answers</h2>
              <AnswerComparison run={run} />
            </div>

            {/* Sources */}
            {run.ragSources.length > 0 && (
              <div className="rounded-xl bg-[#2f2f2f] p-5">
                <SourcesPanel sources={run.ragSources} />
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
