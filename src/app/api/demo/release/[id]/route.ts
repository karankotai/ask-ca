import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const updated = await prisma.scrapedDocument.update({
    where: { id },
    data: { releasedAt: new Date() },
  });

  // For each affected client (severity != not_affected), create a ComplianceItem
  // ONLY if one doesn't already exist for this circular.
  const impacts = await prisma.impactAnalysis.findMany({
    where: { circularId: id },
    include: { client: true },
  });

  const dueDate = updated.deadlineDays
    ? new Date(Date.now() + updated.deadlineDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const ia of impacts) {
    const payload = ia.payload as { severity: string; totalCount: number };
    if (payload.severity === "not_affected") continue;

    const existing = await prisma.complianceItem.findFirst({
      where: { clientId: ia.clientId, circularId: id },
    });
    if (existing) continue;

    await prisma.complianceItem.create({
      data: {
        clientId: ia.clientId,
        circularId: id,
        actName: updated.affectedActs[0] ?? "Companies Act 2013",
        actionRequired: `Review and disclose ${payload.totalCount} transactions per circular ${updated.circularNumber}`,
        dueDate,
        status: "pending",
        severity: payload.severity === "critical" ? "critical" : payload.severity === "high" ? "high" : "medium",
      },
    });
  }

  return NextResponse.json({ id: updated.id, releasedAt: updated.releasedAt });
}
