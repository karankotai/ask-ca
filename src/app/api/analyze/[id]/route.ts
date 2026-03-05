import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const record = await prisma.circularAnalysis.findUnique({ where: { id } });

    if (!record) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(record);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch analysis";
    console.error("Analysis detail error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
