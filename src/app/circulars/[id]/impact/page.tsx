import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";

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

const SEV_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
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
  })?.clientId ?? sorted.find((i) => (i.payload as ImpactPayload).severity !== "not_affected")?.clientId ?? sorted[0]?.clientId;

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
    <div className="screen">
      <div style={{ marginBottom: 18 }}>
        <Link href={`/circulars/${id}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          ← Back to circular
        </Link>
      </div>

      <div className="page-row">
        <div>
          <div className="page-title" style={{ fontSize: 20 }}>{circular.title}</div>
          <div className="page-subtitle">{circular.source} · {circular.date} · {circular.affectedActs.join(", ")}</div>
        </div>
      </div>

      <div className="impact-grid">
        <div>
          <div className="section-heading">Clients affected</div>
          <div className="client-list-card">
            {sorted.map((ia) => {
              const p = ia.payload as ImpactPayload;
              const isSelected = ia.clientId === selectedClientId;
              return (
                <Link
                  key={ia.id}
                  href={`/circulars/${id}/impact?client=${ia.clientId}`}
                  className={`client-list-item ${isSelected ? "selected" : ""}`}
                >
                  <div className="top">
                    <div>
                      <div className="name">{ia.client.name}</div>
                      <div className="meta">
                        {p.severity === "not_affected"
                          ? "No exposure"
                          : `${p.totalCount} txns · ₹${(p.totalAmount / 1e7).toFixed(1)} cr`}
                      </div>
                    </div>
                    <span className={`priority priority-${p.severity}`}>{SEV_LABEL[p.severity] ?? p.severity}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          {selectedImpact && selectedPayload ? (
            <>
              <div className="card" style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{selectedImpact.client.name}</div>
                <div style={{ fontSize: 14, color: "var(--text-mid)", lineHeight: 1.6, marginBottom: 16 }}>
                  {selectedPayload.summary}
                </div>

                <div className="section-eyebrow">Rationale</div>
                <div style={{ fontSize: 13, color: "var(--text-mid)", lineHeight: 1.7 }}>{selectedPayload.rationale}</div>

                {selectedPayload.concentrationMetrics && (
                  <div style={{ marginTop: 16, padding: "14px 16px", background: "var(--bg-main)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-light)", textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 }}>
                      Concentration
                    </div>
                    <div className="conc-line">
                      <span className="pct">{selectedPayload.concentrationMetrics.percentage}%</span>
                      <span className="name">{selectedPayload.concentrationMetrics.counterpartyName}</span>
                      <span className="threshold">(threshold {selectedPayload.concentrationMetrics.threshold}%)</span>
                    </div>
                  </div>
                )}
              </div>

              {selectedTxns.length > 0 && (
                <>
                  <div className="section-heading">{selectedTxns.length} affected transactions</div>
                  <div className="txn-list">
                    {selectedTxns.map((t) => {
                      const aff = selectedPayload.affectedTransactions.find((a) => a.transactionId === t.id);
                      return (
                        <details key={t.id} className="txn-row">
                          <summary>
                            <div className="txn-row-left">
                              <span className="invoice">{t.invoiceNumber}</span>
                              <span className="cp">{t.counterparty.name}</span>
                              <span className="date">{t.date.toLocaleDateString("en-IN")}</span>
                            </div>
                            <span className="txn-row-amount">₹{(t.amount / 1e7).toFixed(2)} cr</span>
                          </summary>
                          {aff && (
                            <div className="txn-detail">
                              <div className="reason">{aff.reason}</div>
                              <div className="actions-label">Required actions</div>
                              <ul>
                                {aff.requiredActions.map((a, i) => <li key={i}>{a}</li>)}
                              </ul>
                            </div>
                          )}
                        </details>
                      );
                    })}
                  </div>
                </>
              )}

              {selectedPayload.severity !== "not_affected" && (
                <div style={{ marginTop: 24 }}>
                  <Link href={`/comms/${selectedImpact.id}`} className="btn btn-primary">
                    <Send size={14} /> Generate client communication
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">Select a client to view their exposure.</div>
          )}
        </div>
      </div>
    </div>
  );
}
