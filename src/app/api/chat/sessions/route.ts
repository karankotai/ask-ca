import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { updatedAt: "desc" },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
  });
  return NextResponse.json(sessions);
}

export async function POST() {
  const session = await prisma.chatSession.create({ data: {} });
  return NextResponse.json(session);
}
