import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const circular = await prisma.scrapedDocument.findUnique({
      where: { id: Number(id) },
    });

    if (!circular) {
      return NextResponse.json(
        { error: "Circular not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ circular });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch circular";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
