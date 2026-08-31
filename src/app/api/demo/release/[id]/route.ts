import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse, parseNumericId } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(
    req,
    { role: "admin", productionDisable: false },
    async ({ params: _p, auth }) => {
      const rawId = (_p as { id: string }).id;
      const id = parseNumericId(rawId);
      if (!id) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }

      const updated = await prisma.scrapedDocument.update({
        where: { id },
        data: { releasedAt: new Date() },
      });

      const impacts = await prisma.impactAnalysis.findMany({
        where: { circularId: id },
        include: { client: true },
      });

      const dueDate = updated.deadlineDays
        ? new Date(Date.now() + updated.deadlineDays * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      let created = 0;
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
            severity:
              payload.severity === "critical"
                ? "critical"
                : payload.severity === "high"
                  ? "high"
                  : "medium",
          },
        });
        created += 1;
      }

      logError("demo.release.ok", {
        by: auth.user.email,
        circularId: id,
        itemsCreated: created,
      });

      return NextResponse.json({
        id: updated.id,
        releasedAt: updated.releasedAt,
        itemsCreated: created,
      });
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
