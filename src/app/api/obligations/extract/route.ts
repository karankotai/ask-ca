import { NextRequest } from "next/server";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, NextResponse } from "@/lib/auth";
import { ObligationsExtractSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    { role: "user", bodySchema: ObligationsExtractSchema },
    async ({ body }) => {
      try {
        const res = await fetch(`${env.RAG_URL}/obligations/extract`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok) {
          return NextResponse.json(
            { error: data.detail || "Extraction failed." },
            { status: res.status },
          );
        }
        return NextResponse.json(data);
      } catch (e) {
        logError("obligations.extract.fetch", e);
        return NextResponse.json(
          { error: "Upstream service unavailable." },
          { status: 502 },
        );
      }
    },
  );
}
