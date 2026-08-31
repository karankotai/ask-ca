import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, NextResponse, parseNumericId } from "@/lib/auth";

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
        const res = await fetch(`${env.RAG_URL}/obligations/${id}`);
        const data = await res.json();
        if (!res.ok) {
          return NextResponse.json(
            { error: data.detail || "Not found." },
            { status: res.status },
          );
        }
        return NextResponse.json(data);
      } catch (e) {
        logError("obligations.byId.fetch", e);
        return NextResponse.json(
          { error: "Upstream service unavailable." },
          { status: 502 },
        );
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
