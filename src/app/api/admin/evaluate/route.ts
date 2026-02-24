import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RAG_URL = process.env.RAG_URL!;

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    // Call backend /evaluate
    const res = await fetch(`${RAG_URL}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Evaluation failed." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const r = data.result;

    // Persist to PostgreSQL
    const evalRun = await prisma.evalRun.create({
      data: {
        question: r.question,
        groundTruth: r.ground_truth ?? null,
        sourceFilter: body.source_filter ?? null,
        baselines: body.baselines ?? ["gpt", "gemini"],
        ragAnswer: r.rag_eval.answer,
        ragAvgScore: r.rag_eval.average_score,
        ragTotalScore: r.rag_eval.total_score,
        gptAnswer: r.vanilla_gpt_eval?.answer ?? null,
        gptAvgScore: r.vanilla_gpt_eval?.average_score ?? null,
        gptTotalScore: r.vanilla_gpt_eval?.total_score ?? null,
        geminiAnswer: r.vanilla_gemini_eval?.answer ?? null,
        geminiAvgScore: r.vanilla_gemini_eval?.average_score ?? null,
        geminiTotalScore: r.vanilla_gemini_eval?.total_score ?? null,
        ragAdvantageVsGpt: r.rag_advantage_vs_gpt ?? null,
        ragAdvantageVsGemini: r.rag_advantage_vs_gemini ?? null,
        ragScores: r.rag_eval.scores,
        gptScores: r.vanilla_gpt_eval?.scores ?? null,
        geminiScores: r.vanilla_gemini_eval?.scores ?? null,
        ragSources: r.rag_sources,
      },
    });

    return NextResponse.json({ result: r, evalRunId: evalRun.id });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
