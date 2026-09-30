import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "user" }, async ({ req: r }) => {
    try {
      const url = r.nextUrl;
      const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
      const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
      const offset = (page - 1) * limit;

      const [total, items] = await Promise.all([
        prisma.evalRun.count(),
        prisma.evalRun.findMany({
          orderBy: { createdAt: "desc" },
          skip: offset,
          take: limit,
        }),
      ]);

      return NextResponse.json({
        runs: items,
        page,
        totalPages: Math.ceil(total / limit),
        total,
      });
    } catch (err) {
      logError("evaluate.history.fetch", err);
      const message =
        err instanceof Error ? err.message : "Failed to fetch history";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}
