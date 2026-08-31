import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth } from "@/lib/auth";
import { AdminCrawlSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    { role: "admin", bodySchema: AdminCrawlSchema },
    async ({ body }) => {
      const res = await fetch(`${env.RAG_URL}/crawl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return Response.json(
          { error: text || "Crawl request failed." },
          { status: res.status },
        );
      }

      const data = await res.json();
      return Response.json(data);
    },
  ).catch((e) => {
    logError("admin.crawl.uncaught", e);
    return Response.json({ error: "Upstream service unavailable." }, { status: 502 });
  });
}
