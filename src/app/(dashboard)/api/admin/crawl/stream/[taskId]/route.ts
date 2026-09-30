import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  return withAuth(
    req,
    { role: "admin" },
    async ({ params: _p }) => {
      const taskId = (_p as { taskId: string }).taskId;
      const res = await fetch(`${env.RAG_URL}/crawl/stream/${taskId}`);

      if (!res.ok || !res.body) {
        const text = await res.text();
        return Response.json(
          { error: text || "Failed to connect to crawl stream." },
          { status: res.status },
        );
      }

      return new Response(res.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
    params as unknown as Promise<Record<string, unknown>>,
  ).catch((e) => {
    logError("admin.crawl.stream.uncaught", e);
    return Response.json({ error: "Upstream service unavailable." }, { status: 502 });
  });
}
