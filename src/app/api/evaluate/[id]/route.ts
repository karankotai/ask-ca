import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const run = await prisma.evalRun.findUnique({ where: { id } });

    if (!run) {
      return NextResponse.json(
        { error: "Evaluation not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ run });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch evaluation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
