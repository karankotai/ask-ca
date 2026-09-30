import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, parseNumericId } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  return withAuth(
    req,
    { role: "admin" },
    async ({ params: _p }) => {
      const taskId = (_p as { taskId: string }).taskId;
      const res = await fetch(`${env.RAG_URL}/crawl/${taskId}`);

      if (!res.ok) {
        const text = await res.text();
        return Response.json(
          { error: text || "Failed to fetch crawl status." },
          { status: res.status },
        );
      }

      const data = await res.json();
      return Response.json(data);
    },
    params as unknown as Promise<Record<string, unknown>>,
  ).catch((e) => {
    logError("admin.crawl.byId.uncaught", e);
    return Response.json({ error: "Upstream service unavailable." }, { status: 502 });
  });
}
