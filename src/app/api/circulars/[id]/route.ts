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
      const rawId = (_p as { id: string }).id;
      const id = parseNumericId(rawId);
      if (!id) {
        return NextResponse.json({ error: "Invalid id" }, { status: 400 });
      }
      try {
        const circular = await prisma.scrapedDocument.findUnique({
          where: { id },
        });
        if (!circular) {
          return NextResponse.json(
            { error: "Circular not found" },
            { status: 404 },
          );
        }
        return NextResponse.json({ circular });
      } catch (e) {
        logError("circulars.byId", e);
        const message =
          e instanceof Error ? e.message : "Failed to fetch circular";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
