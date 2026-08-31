import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "user" }, async ({ req: r }) => {
    try {
      const since = r.nextUrl.searchParams.get("since");
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000);

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
          const all = await prisma.impactAnalysis.findMany({
            where: { circularId: c.id },
          });
          const affected = all.filter((ia) => {
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
    } catch (e) {
      logError("notifications.recent", e);
      return NextResponse.json({ error: "Failed." }, { status: 500 });
    }
  });
}
