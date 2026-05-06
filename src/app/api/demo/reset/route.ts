import { NextResponse } from "next/server";
import { resetDemoState } from "../../../../../scripts/reset-demo";

export async function POST() {
  await resetDemoState();
  return NextResponse.json({ ok: true });
}
