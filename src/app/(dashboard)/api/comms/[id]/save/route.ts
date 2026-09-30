import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, NextResponse } from "@/lib/auth";
import { logError } from "@/lib/logging";
import { z } from "zod";

const CommSaveSchema = z.object({
  subject: z.string().min(1).max(500),
  body: z.string().min(1).max(100_000),
  channel: z.enum(["email", "whatsapp", "notice", "letter"]).default("email"),
});

type CommSaveBody = z.infer<typeof CommSaveSchema>;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAuth<CommSaveBody>(
    req,
    { role: "user", bodySchema: CommSaveSchema },
    async ({ params: _p, body }) => {
      const id = (_p as { id: string }).id;
      try {
        const updated = await prisma.draftComm.update({
          where: { id },
          data: {
            subject: body!.subject,
            body: body!.body,
            channel: body!.channel,
            status: "saved",
          },
        });
        return NextResponse.json({ ok: true, id: updated.id });
      } catch (e) {
        logError("comms.save", e);
        return NextResponse.json({ error: "Failed to save comm." }, { status: 500 });
      }
    },
    params as unknown as Promise<Record<string, unknown>>,
  );
}
