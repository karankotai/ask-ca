import { NextRequest, NextResponse } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams.toString();
    const res = await fetch(`${RAG_URL}/obligations?${params}`);

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || "Failed to fetch obligations." },
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
