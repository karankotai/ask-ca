import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.complianceItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "not found" }, { status: 404 });
  const newStatus = item.status === "done" ? "pending" : "done";
  const updated = await prisma.complianceItem.update({
    where: { id },
    data: { status: newStatus },
  });
  return NextResponse.json({ ok: true, status: updated.status });
}
