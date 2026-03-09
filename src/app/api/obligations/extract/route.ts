import { NextRequest, NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${RAG_URL}/obligations/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || "Extraction failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Could not connect to backend at " + RAG_URL },
      { status: 502 }
    );
  }
}
