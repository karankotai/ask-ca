import { NextRequest, NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${RAG_URL}/obligations/${id}`);

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || "Not found." },
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
