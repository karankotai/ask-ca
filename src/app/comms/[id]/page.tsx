import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import CommsEditor from "./CommsEditor";

export const dynamic = "force-dynamic";

export default async function CommsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const ia = await prisma.impactAnalysis.findUnique({
    where: { id },
    include: { client: true, scrapedDocument: true },
  });
  if (!ia) notFound();

  const comm = await prisma.draftComm.findUnique({
    where: { circularId_clientId: { circularId: ia.circularId, clientId: ia.clientId } },
  });
  if (!comm) {
    return (
      <div className="screen" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="card">
          <p style={{ color: "var(--text-mid)" }}>No draft comm exists for this client × circular yet. Re-run precompute.</p>
        </div>
      </div>
    );
  }

  const siblings = await prisma.draftComm.findMany({
    where: { circularId: ia.circularId, NOT: { id: comm.id } },
    include: { client: true },
  });

  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="screen" style={{ maxWidth: 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <Link href={`/circulars/${ia.circularId}/impact?client=${ia.clientId}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          ← Back to impact view
        </Link>
      </div>

      <CommsEditor
        commId={comm.id}
        clientName={ia.client.name}
        circularTitle={ia.scrapedDocument.title}
        today={today}
        initialSubject={comm.subject}
        initialBody={comm.body}
        initialChannel={comm.channel}
      />

      {siblings.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div className="section-heading">Other drafts for this circular</div>
          <div className="client-list-card">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/circulars/${ia.circularId}/impact?client=${s.clientId}`}
                className="client-list-item"
              >
                <div className="top">
                  <div>
                    <div className="name">{s.client.name}</div>
                    <div className="meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 480 }}>
                      {s.subject}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
