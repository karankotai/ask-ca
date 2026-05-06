import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

type ImpactPayload = {
  severity: string;
  summary: string;
  rationale: string;
  affectedTransactions: Array<{ transactionId: string; reason: string; requiredActions: string[] }>;
  concentrationMetrics: { counterpartyName: string; percentage: number; threshold: number } | null;
  totalAmount: number;
  totalCount: number;
};

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, not_affected: 4 };

const SEV_BADGE: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  high: "bg-orange-100 text-orange-800 border-orange-300",
  medium: "bg-amber-100 text-amber-800 border-amber-300",
  low: "bg-slate-100 text-slate-700 border-slate-300",
  not_affected: "bg-slate-50 text-slate-500 border-slate-200",
};

const SEV_LABEL: Record<string, string> = {
  critical: "🔴 CRITICAL",
  high: "🟠 HIGH",
  medium: "🟡 MEDIUM",
  low: "⚪ LOW",
  not_affected: "Not affected",
};

export default async function ImpactPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ client?: string }>;
}) {
  const { id: idStr } = await params;
  const { client: clientIdParam } = await searchParams;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) notFound();

  const circular = await prisma.scrapedDocument.findUnique({ where: { id } });
  if (!circular) notFound();

  const allImpacts = await prisma.impactAnalysis.findMany({
    where: { circularId: id },
    include: { client: true },
  });

  const sorted = allImpacts.sort((a, b) => {
    const sa = (a.payload as ImpactPayload).severity;
    const sb = (b.payload as ImpactPayload).severity;
    return (SEV_ORDER[sa] ?? 5) - (SEV_ORDER[sb] ?? 5);
  });

  const defaultClientId = sorted.find((i) => {
    const p = i.payload as ImpactPayload;
    return p.severity !== "not_affected" && i.client.sector === "pharma";
  })?.clientId ?? sorted[0]?.clientId;

  const selectedClientId = clientIdParam ?? defaultClientId;

  const selectedImpact = sorted.find((i) => i.clientId === selectedClientId);
  const selectedPayload = selectedImpact?.payload as ImpactPayload | undefined;

  const selectedTxns = selectedImpact && selectedPayload
    ? await prisma.transaction.findMany({
        where: { id: { in: selectedPayload.affectedTransactions.map((t) => t.transactionId) } },
        include: { counterparty: true },
        orderBy: { date: "desc" },
      })
    : [];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <Link href={`/circulars/${id}`} className="text-sm text-blue-600 hover:underline">← Back to circular</Link>
        <h1 className="text-2xl font-semibold mt-2">{circular.title}</h1>
        <p className="text-slate-600 text-sm mt-1">{circular.source} · {circular.date} · {circular.affectedActs.join(", ")}</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Clients affected</h2>
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            {sorted.map((ia) => {
              const p = ia.payload as ImpactPayload;
              const isSelected = ia.clientId === selectedClientId;
              return (
                <Link
                  key={ia.id}
                  href={`/circulars/${id}/impact?client=${ia.clientId}`}
                  className={`block px-4 py-3 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 ${isSelected ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{ia.client.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {p.totalCount} txns · ₹{(p.totalAmount / 1e7).toFixed(1)} cr
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${SEV_BADGE[p.severity] ?? ""}`}>
                      {SEV_LABEL[p.severity] ?? p.severity}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="col-span-8">
          {selectedImpact && selectedPayload ? (
            <>
              <h2 className="text-xl font-semibold mb-1">{selectedImpact.client.name}</h2>
              <p className="text-sm text-slate-700 mb-4">{selectedPayload.summary}</p>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Rationale</div>
                <p className="text-sm text-slate-800">{selectedPayload.rationale}</p>
                {selectedPayload.concentrationMetrics && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs text-slate-600">Concentration</div>
                    <div className="text-sm font-medium">
                      {selectedPayload.concentrationMetrics.counterpartyName}: {selectedPayload.concentrationMetrics.percentage}%
                      <span className="text-slate-500"> (threshold {selectedPayload.concentrationMetrics.threshold}%)</span>
                    </div>
                  </div>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                {selectedTxns.length} affected transactions
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                {selectedTxns.map((t) => {
                  const aff = selectedPayload.affectedTransactions.find((a) => a.transactionId === t.id);
                  return (
                    <details key={t.id} className="border-b border-slate-100 last:border-b-0">
                      <summary className="px-4 py-3 cursor-pointer hover:bg-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-slate-500">{t.invoiceNumber}</span>
                          <span>{t.counterparty.name}</span>
                          <span className="text-xs text-slate-500">{t.date.toLocaleDateString("en-IN")}</span>
                        </div>
                        <div className="text-sm font-medium">₹{(t.amount / 1e7).toFixed(2)} cr</div>
                      </summary>
                      {aff && (
                        <div className="px-4 pb-3 text-sm">
                          <p className="text-slate-700 mb-2">{aff.reason}</p>
                          <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Required actions</div>
                          <ul className="list-disc list-inside text-sm text-slate-700 mt-1">
                            {aff.requiredActions.map((a, i) => <li key={i}>{a}</li>)}
                          </ul>
                        </div>
                      )}
                    </details>
                  );
                })}
              </div>

              <div className="mt-6">
                <Link
                  href={`/comms/${selectedImpact.id}`}
                  className="inline-block bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700"
                >
                  Generate client communications →
                </Link>
              </div>
            </>
          ) : (
            <div className="text-slate-500">Select a client to view their exposure.</div>
          )}
        </div>
      </div>
    </div>
  );
}
