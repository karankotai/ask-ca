import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  try {
    const since = req.nextUrl.searchParams.get("since");
    const sinceDate = since
      ? new Date(since)
      : new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);

    const releasedAtFiltered = await prisma.scrapedDocument.findMany({
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
        createdAt: true,
      },
    });

    let recent = releasedAtFiltered;
    if (recent.length === 0) {
      recent = await prisma.scrapedDocument.findMany({
        where: { crawler: "demo" },
        orderBy: [{ releasedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
        take: 5,
        select: {
          id: true,
          title: true,
          severity: true,
          releasedAt: true,
          affectedActs: true,
          createdAt: true,
        },
      });
    }

    type NotifRow = {
      id: number;
      title: string;
      severity: string | null;
      releasedAt: Date | null;
      affectedActs: string[];
      createdAt: Date;
    };
    const counts = await Promise.all(
      recent.map(async (c) => {
        const row = c as NotifRow;
        const all = await prisma.impactAnalysis.findMany({
          where: { circularId: row.id },
        });
        const affected = all.filter((ia) => {
          const p = ia.payload as { severity?: string } | null | undefined;
          return !!p?.severity && p.severity !== "not_affected";
        }).length;
        return { id: row.id, affectedCount: affected };
      }),
    );
    const countMap = new Map(counts.map((x) => [x.id, x.affectedCount]));

    return NextResponse.json({
      notifications: recent.map((c) => {
        const row = c as NotifRow;
        return {
          id: row.id,
          title: row.title,
          severity: row.severity,
          releasedAt: row.releasedAt ?? row.createdAt,
          affectedActs: row.affectedActs,
          affectedCount: countMap.get(row.id) ?? 0,
        };
      }),
    });
  } catch (e) {
    logError("notifications.recent", e);
    return NextResponse.json({ error: "Failed." }, { status: 500 });
  }
}
