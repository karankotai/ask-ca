import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { title, inputMode, fileName, analysis } = await req.json();

    if (!analysis) {
      return NextResponse.json({ error: "analysis is required" }, { status: 400 });
    }

    const record = await prisma.circularAnalysis.create({
      data: {
        title: title || "",
        inputMode: inputMode || "text",
        fileName: fileName || null,
        analysis,
      },
    });

    return NextResponse.json({ id: record.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save analysis";
    console.error("Save analysis error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
