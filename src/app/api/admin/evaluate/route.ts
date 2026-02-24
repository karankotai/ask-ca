import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const RAG_URL = process.env.RAG_URL || "http://127.0.0.1:8000";

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
        ragAnswer: r.rag_eval.answer,
        ragAvgScore: r.rag_eval.average_score,
        ragTotalScore: r.rag_eval.total_score,
        vanillaAnswer: r.vanilla_eval.answer,
        vanillaAvgScore: r.vanilla_eval.average_score,
        vanillaTotalScore: r.vanilla_eval.total_score,
        ragAdvantage: r.rag_advantage,
        ragScores: r.rag_eval.scores,
        vanillaScores: r.vanilla_eval.scores,
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
