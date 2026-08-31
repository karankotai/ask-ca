import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "user" }, async () => {
    try {
      const liveDrop = await prisma.scrapedDocument.findFirst({
        where: { isLiveDrop: true },
        select: { id: true, circularNumber: true },
      });
      return NextResponse.json({ liveDrop });
    } catch (e) {
      logError("demo.liveDropInfo", e);
      return NextResponse.json({ error: "Failed." }, { status: 500 });
    }
  });
}
