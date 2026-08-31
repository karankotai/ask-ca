import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, NextResponse } from "@/lib/auth";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "admin" }, async () => {
    try {
      const res = await fetch(`${env.RAG_URL}/health`);
      if (!res.ok) {
        return NextResponse.json(
          { error: "Backend unhealthy", status: res.status },
          { status: res.status },
        );
      }
      const data = await res.json();
      return NextResponse.json(data);
    } catch (e) {
      logError("admin.health.fetch", e);
      return NextResponse.json(
        { error: "Upstream service unavailable." },
        { status: 502 },
      );
    }
  });
}
