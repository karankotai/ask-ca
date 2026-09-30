import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
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
        const run = await prisma.evalRun.findUnique({ where: { id } });
        if (!run) {
          return NextResponse.json(
            { error: "Evaluation not found." },
            { status: 404 },
          );
        }
        return NextResponse.json({ run });
      } catch (err) {
        logError("evaluate.detail.fetch", err);
        const message =
          err instanceof Error ? err.message : "Failed to fetch evaluation";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
