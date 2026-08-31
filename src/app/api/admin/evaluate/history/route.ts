import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "admin" }, async () => {
    try {
      const runs = await prisma.evalRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
      });
      return NextResponse.json({ runs });
    } catch (err) {
      logError("admin.evaluate.history.fetch", err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch history";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
