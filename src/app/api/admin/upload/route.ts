import { NextRequest, NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const res = await fetch(`${RAG_URL}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: text || "Upload failed." },
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
