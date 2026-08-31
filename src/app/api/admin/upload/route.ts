import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { logError } from "@/lib/logging";
import { withAuth, NextResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return withAuth(req, { role: "admin" }, async ({ auth }) => {
    try {
      const formData = await req.formData();
      const res = await fetch(`${env.RAG_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        return NextResponse.json(
          { error: text || "Upload failed." },
          { status: res.status },
        );
      }

      const data = await res.json();
      logError("admin.upload.success", {
        by: auth.user.email,
        id: data?.id ?? null,
      });
      return NextResponse.json(data);
    } catch (e) {
      logError("admin.upload.fetch", e);
      return NextResponse.json(
        { error: "Upstream service unavailable." },
        { status: 502 },
      );
    }
  });
}
