import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = Number(id);
  const { userMessage, assistantMessage, sources, title } = await req.json();

  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.createMany({
      data: [
        { sessionId, role: "user", content: userMessage },
        {
          sessionId,
          role: "assistant",
          content: assistantMessage,
          sources: sources ?? [],
        },
      ],
    });

    const session = await tx.chatSession.findUnique({
      where: { id: sessionId },
      select: { title: true },
    });

    await tx.chatSession.update({
      where: { id: sessionId },
      data: {
        ...(session?.title === "" && title ? { title } : {}),
      },
    });
  });

  return NextResponse.json({ ok: true });
}
