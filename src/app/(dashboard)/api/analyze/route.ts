import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, NextResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return withAuth(req, { role: "user" }, async ({ req: r, auth }) => {
    try {
      const formData = await r.formData();
      const res = await fetch(`${env.RAG_URL}/analyze/stream`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        return new Response(
          JSON.stringify({ error: text || "Analysis failed." }),
          { status: res.status, headers: { "Content-Type": "application/json" } },
        );
      }

      return new Response(res.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (e) {
      logError("analyze.stream.fetch", e);
      return new Response(
        JSON.stringify({ error: "Upstream service unavailable." }),
        { status: 502, headers: { "Content-Type": "application/json" } },
      );
    }
  });
}
