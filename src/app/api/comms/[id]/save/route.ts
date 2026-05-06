import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await prisma.draftComm.update({
    where: { id },
    data: {
      subject: body.subject,
      body: body.body,
      channel: body.channel ?? "email",
      status: "saved",
    },
  });
  return NextResponse.json({ ok: true, id: updated.id });
}
