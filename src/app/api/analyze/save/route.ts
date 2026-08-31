import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";
import { AnalyzeRunSchema } from "@/lib/validation";
import { z } from "zod";

type AnalyzeRunBody = z.infer<typeof AnalyzeRunSchema>;

export async function POST(req: NextRequest) {
  return withAuth<AnalyzeRunBody>(
    req,
    { role: "user", bodySchema: AnalyzeRunSchema },
    async ({ body }) => {
      try {
        const record = await prisma.circularAnalysis.create({
          data: {
            title: body!.title || "",
            inputMode: "text",
            fileName: body!.runId ? `run-${body!.runId}.md` : null,
            analysis: body!.analysis,
          },
        });
        return NextResponse.json({ id: record.id });
      } catch (err) {
        logError("analyze.save", err);
        const message =
          err instanceof Error ? err.message : "Failed to save analysis";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },
  );
}
