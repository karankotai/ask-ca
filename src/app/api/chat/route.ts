import { NextRequest, NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function POST(req: NextRequest) {
  const { question } = await req.json();

  try {
    const res = await fetch(`${RAG_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!res.ok) {
      return NextResponse.json(
        { answer: "RAG service returned an error." },
        { status: res.status }
      );
    }

    const data = await res.json();

    const answer = data.answer ?? data.response ?? data.result ?? JSON.stringify(data);
    const sources = data.sources ?? [];

    return NextResponse.json({ answer, sources });
  } catch {
    return NextResponse.json(
      { answer: "Could not connect to RAG service. Is it running on " + RAG_URL + "?" },
      { status: 502 }
    );
  }
}
