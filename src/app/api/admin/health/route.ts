import { NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${RAG_URL}/health`);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Backend unhealthy", status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not connect to backend at " + RAG_URL },
      { status: 502 }
    );
  }
}
