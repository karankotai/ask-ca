import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth } from "@/lib/auth";
import { AdminIndexSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    { role: "admin", bodySchema: AdminIndexSchema },
    async ({ body }) => {
      const res = await fetch(`${env.RAG_URL}/index`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return Response.json(
          { error: text || "Indexing failed." },
          { status: res.status },
        );
      }

      const data = await res.json();
      return Response.json(data);
    },
  ).catch((e) => {
    logError("admin.index.uncaught", e);
    return Response.json({ error: "Upstream service unavailable." }, { status: 502 });
  });
}
