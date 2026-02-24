"use client";

import { useState } from "react";
import { LoadingDots, ErrorBox, CriterionScore } from "./shared";

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
  } | null;

  const hasGpt = r?.vanilla_gpt_eval != null;
  const hasGemini = r?.vanilla_gemini_eval != null;

  const baselinesLabel = [
    "RAG",
    ...(baselines.includes("gpt") ? ["GPT"] : []),
    ...(baselines.includes("gemini") ? ["Gemini"] : []),
  ].join(" + ");

  return (
    <div className="space-y-6">
      <form onSubmit={handleEvaluate} className="space-y-4">
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
              Ground Truth <span className="text-zinc-500">(optional)</span>
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
              Source Filter <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              placeholder="e.g. RBI, SEBI, IRDAI, MCA"
              className="w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            />
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
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !question.trim() || baselines.length === 0}
          className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
        >
          {loading ? "Evaluating..." : "Run & Save"}
        </button>
      </form>

      {loading && (
        <div className="flex flex-col items-center gap-3 py-8">
          <LoadingDots />
          <p className="text-sm text-zinc-400">
            Running {baselinesLabel} + judge evaluation...
          </p>
        </div>
      )}

      {error && <ErrorBox message={error} />}

      {r && (
        <div className="rounded-xl bg-[#2f2f2f] p-5">
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-400">Question</p>
              <p className="mt-0.5 font-medium">{r.question}</p>
            </div>
            <div className="flex gap-5 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-400">
                  {r.rag_eval.average_score.toFixed(1)}
                </p>
                <p className="text-xs text-zinc-400">RAG</p>
              </div>
              {hasGpt && (
                <div>
                  <p className="text-2xl font-bold text-orange-400">
                    {r.vanilla_gpt_eval!.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">GPT</p>
                </div>
              )}
              {hasGemini && (
                <div>
                  <p className="text-2xl font-bold text-blue-400">
                    {r.vanilla_gemini_eval!.average_score.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">Gemini</p>
                </div>
              )}
              {r.rag_advantage_vs_gpt != null && (
                <div className="border-l border-zinc-700 pl-5">
                  <p
                    className={`text-2xl font-bold ${
                      r.rag_advantage_vs_gpt > 0
                        ? "text-emerald-400"
                        : r.rag_advantage_vs_gpt < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {r.rag_advantage_vs_gpt > 0 ? "+" : ""}
                    {r.rag_advantage_vs_gpt.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">vs GPT</p>
                </div>
              )}
              {r.rag_advantage_vs_gemini != null && (
                <div>
                  <p
                    className={`text-2xl font-bold ${
                      r.rag_advantage_vs_gemini > 0
                        ? "text-emerald-400"
                        : r.rag_advantage_vs_gemini < 0
                          ? "text-red-400"
                          : "text-zinc-400"
                    }`}
                  >
                    {r.rag_advantage_vs_gemini > 0 ? "+" : ""}
                    {r.rag_advantage_vs_gemini.toFixed(1)}
                  </p>
                  <p className="text-xs text-zinc-400">vs Gemini</p>
                </div>
              )}
            </div>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-xs uppercase tracking-wide text-zinc-400">
                <th className="py-2 pr-4">Criterion</th>
                <th className="px-3 py-2 text-center">RAG</th>
                {hasGpt && <th className="px-3 py-2 text-center">GPT</th>}
                {hasGemini && <th className="px-3 py-2 text-center">Gemini</th>}
                {hasGpt && <th className="px-2 py-2 text-center">vs GPT</th>}
                {hasGemini && <th className="py-2 pl-2 text-center">vs Gemini</th>}
              </tr>
            </thead>
            <tbody>
              {r.rag_eval.scores.map((rs: CriterionScore, i: number) => {
                const gs = r.vanilla_gpt_eval?.scores[i];
                const ges = r.vanilla_gemini_eval?.scores[i];
                const dGpt = rs.score - (gs?.score ?? 0);
                const dGem = rs.score - (ges?.score ?? 0);
                return (
                  <tr key={rs.criterion} className="border-b border-zinc-800">
                    <td className="py-2 pr-4 text-zinc-300">{rs.criterion}</td>
                    <td className="px-3 py-2 text-center">{rs.score}</td>
                    {hasGpt && (
                      <td className="px-3 py-2 text-center">
                        {gs?.score ?? "\u2014"}
                      </td>
                    )}
                    {hasGemini && (
                      <td className="px-3 py-2 text-center">
                        {ges?.score ?? "\u2014"}
                      </td>
                    )}
                    {hasGpt && (
                      <td className="px-2 py-2 text-center">
                        <span
                          className={`font-semibold ${
                            dGpt > 0
                              ? "text-emerald-400"
                              : dGpt < 0
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
                        >
                          {dGpt > 0 ? "+" : ""}
                          {dGpt}
                        </span>
                      </td>
                    )}
                    {hasGemini && (
                      <td className="py-2 pl-2 text-center">
                        <span
                          className={`font-semibold ${
                            dGem > 0
                              ? "text-emerald-400"
                              : dGem < 0
                                ? "text-red-400"
                                : "text-zinc-500"
                          }`}
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
      )}
    </div>
  );
}
