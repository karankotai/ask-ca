import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const runs = await prisma.evalRun.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ runs });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to fetch history";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
