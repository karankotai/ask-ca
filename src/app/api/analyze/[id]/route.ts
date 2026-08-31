import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse, parseNumericId } from "@/lib/auth";
import { logError } from "@/lib/logging";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth(
    req,
    { role: "user" },
    async ({ params: _p }) => {
      const id = (_p as { id: string }).id;
      try {
        const record = await prisma.circularAnalysis.findUnique({
          where: { id },
        });
        if (!record) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        return NextResponse.json(record);
      } catch (err) {
        logError("analyze.detail.fetch", err);
        const message =
          err instanceof Error ? err.message : "Failed to fetch analysis";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
