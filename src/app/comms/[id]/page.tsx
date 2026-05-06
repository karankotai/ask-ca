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
      <div className="max-w-3xl mx-auto px-6 py-8">
        <p className="text-slate-600">No draft comm exists for this client × circular yet. Re-run precompute.</p>
      </div>
    );
  }

  const siblings = await prisma.draftComm.findMany({
    where: { circularId: ia.circularId, NOT: { id: comm.id } },
    include: { client: true },
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-4">
        <Link href={`/circulars/${ia.circularId}/impact`} className="text-sm text-blue-600 hover:underline">
          ← Back to impact view
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-1">Communication: {ia.client.name}</h1>
      <p className="text-slate-600 text-sm mb-6">{ia.scrapedDocument.title}</p>

      <CommsEditor commId={comm.id} initialSubject={comm.subject} initialBody={comm.body} initialChannel={comm.channel} />

      {siblings.length > 0 && (
        <div className="mt-10 pt-6 border-t border-slate-200">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Other drafts for this circular</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {siblings.map((s) => (
              <Link
                key={s.id}
                href={`/circulars/${ia.circularId}/impact?client=${s.clientId}`}
                className="block px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50"
              >
                <div className="font-medium">{s.client.name}</div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{s.subject}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
