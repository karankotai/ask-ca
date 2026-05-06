import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since");
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 24 * 60 * 60 * 1000);

  const recent = await prisma.scrapedDocument.findMany({
    where: {
      releasedAt: { not: null, gte: sinceDate, lte: new Date() },
      crawler: "demo",
    },
    orderBy: { releasedAt: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      severity: true,
      releasedAt: true,
      affectedActs: true,
    },
  });

  const counts = await Promise.all(
    recent.map(async (c) => {
      const allImpacts = await prisma.impactAnalysis.findMany({
        where: { circularId: c.id },
      });
      const affected = allImpacts.filter((ia) => {
        const p = ia.payload as { severity?: string };
        return p.severity && p.severity !== "not_affected";
      }).length;
      return { id: c.id, affectedCount: affected };
    }),
  );

  const countMap = new Map(counts.map((x) => [x.id, x.affectedCount]));

  return NextResponse.json({
    notifications: recent.map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      releasedAt: c.releasedAt,
      affectedActs: c.affectedActs,
      affectedCount: countMap.get(c.id) ?? 0,
    })),
  });
}
