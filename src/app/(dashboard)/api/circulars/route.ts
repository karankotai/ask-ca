import { NextRequest } from "next/server";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  return withAuth(req, { role: "user" }, async ({ req: r }) => {
    try {
      const params = r.nextUrl.searchParams.toString();
      const res = await fetch(`${env.RAG_URL}/circulars?${params}`);

      const data = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { error: data.detail || "Failed to fetch circulars via RAG." },
          { status: res.status },
        );
      }
      return NextResponse.json(data);
    } catch (e) {
      logError("circulars.list.fetch", e);
      return NextResponse.json(
        { error: "Upstream service unavailable." },
        { status: 502 },
      );
    }
  });
}
