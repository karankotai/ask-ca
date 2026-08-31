import { NextRequest } from "next/server";
import { resetDemoState } from "../../../../../scripts/reset-demo";
import { withAuth, NextResponse } from "@/lib/auth";

export async function POST(req: NextRequest) {
  return withAuth(
    req,
    { role: "admin", productionDisable: true },
    async ({ auth }) => {
      await resetDemoState();
      return NextResponse.json({ ok: true, resetBy: auth.user.email });
    },
  );
}
