import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 10, 100);

    const [analyses, total] = await Promise.all([
      prisma.circularAnalysis.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, createdAt: true, title: true, inputMode: true, fileName: true },
      }),
      prisma.circularAnalysis.count(),
    ]);

    return NextResponse.json({
      analyses,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch history";
    console.error("History error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
