import { NextRequest } from "next/server";

const RAG_URL = process.env.RAG_URL!;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const res = await fetch(`${RAG_URL}/analyze/stream`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok || !res.body) {
      const text = await res.text();
      return new Response(JSON.stringify({ error: text || "Analysis failed." }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Could not connect to backend at " + RAG_URL }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
