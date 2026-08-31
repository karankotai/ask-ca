import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";
import { ComplianceToggleSchema } from "@/lib/validation";
import { z } from "zod";

type ComplianceToggleBody = z.infer<typeof ComplianceToggleSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth<ComplianceToggleBody>(
    req,
    { role: "user", bodySchema: ComplianceToggleSchema },
    async ({ params: _p, body }) => {
      const id = (_p as { id: string }).id;
      try {
        const item = await prisma.complianceItem.findUnique({
          where: { id },
        });
        if (!item) {
          return NextResponse.json({ error: "not found" }, { status: 404 });
        }

        if (body && (body.completed !== undefined || body.notes !== undefined || body.dismissed !== undefined)) {
          const nextStatus =
            body.dismissed === true
              ? "dismissed"
              : body.completed === true
                ? "done"
                : item.status;
          const updated = await prisma.complianceItem.update({
            where: { id },
            data: {
              status: nextStatus,
            },
          });
          return NextResponse.json({ ok: true, status: updated.status });
        } else {
          const newStatus = item.status === "done" ? "pending" : "done";
          const updated = await prisma.complianceItem.update({
            where: { id },
            data: { status: newStatus },
          });
          return NextResponse.json({ ok: true, status: updated.status });
        }
      } catch (e) {
        logError("compliance.toggle", e);
        return NextResponse.json({ error: "Failed." }, { status: 500 });
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
