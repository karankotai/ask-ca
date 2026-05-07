import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const liveDrop = await prisma.scrapedDocument.findFirst({
    where: { isLiveDrop: true },
    select: { id: true, circularNumber: true },
  });
  return NextResponse.json({ liveDrop });
}
