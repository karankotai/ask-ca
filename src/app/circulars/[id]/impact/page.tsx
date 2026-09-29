import { prisma } from "@/lib/prisma";
import {
  severityLabel,
  severityPriorityClass,
  deadlineFromPublished,
  type DeadlineInfo,
} from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Send } from "lucide-react";
import type { ImpactPayload } from "@/types/impact";

export const dynamic = "force-dynamic";

const SEV_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, not_affected: 4 };

type ImpactRow = {
  id: string;
  circularId: number;
  clientId: string;
  payload: ImpactPayload;
  client: {
    id: string;
    name: string;
    sector: string;
  };
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
    include: { client: { select: { id: true, name: true, sector: true } } },
  }) as unknown as ImpactRow[];

  const sorted = allImpacts.sort((a, b) => {
    const sa = a.payload.severity;
    const sb = b.payload.severity;
    return (SEV_ORDER[sa] ?? 5) - (SEV_ORDER[sb] ?? 5);
  });

  const defaultClientId = sorted.find((i) => {
    return i.payload.severity !== "not_affected" && i.client.sector === "pharma";
  })?.clientId ?? sorted.find((i) => i.payload.severity !== "not_affected")?.clientId ?? sorted[0]?.clientId;

  const selectedClientId = clientIdParam ?? defaultClientId;
  const selectedImpact = sorted.find((i) => i.clientId === selectedClientId);
  const selectedPayload = selectedImpact?.payload;

  const selectedTxns = selectedImpact && selectedPayload
    ? await prisma.transaction.findMany({
        where: { id: { in: selectedPayload.affectedTransactions.map((t) => t.transactionId) } },
        include: { counterparty: true },
        orderBy: { date: "desc" },
      })
    : [];

  const deadlineInfo: DeadlineInfo = deadlineFromPublished(
    circular.releasedAt ?? circular.createdAt,
    circular.deadlineDays,
  );

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 18, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <Link href={`/circulars/${id}`} style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          ← Back to circular
        </Link>
        <span style={{ fontSize: 12, color: "var(--text-light)" }}>·</span>
        <Link href="/circulars" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>
          All circulars
        </Link>
      </div>

      <div className="page-row">
        <div>
          <div className="page-title" style={{ fontSize: 20 }}>{circular.title}</div>
          <div className="page-subtitle">
            {circular.source} · {circular.date} · {circular.affectedActs.join(", ")}
            {deadlineInfo && (
              <>
                {" · "}
                <span style={{
                  color: deadlineInfo.isOverdue ? "var(--danger)" : deadlineInfo.isToday ? "var(--warning)" : "inherit",
                  fontWeight: deadlineInfo.dueSoon ? 600 : 400,
                }}>
                  {deadlineInfo.relative} · {deadlineInfo.absolute}
                </span>
              </>
            )}
          </div>
        </div>
        <span className={severityPriorityClass(circular.severity)} style={{ padding: "6px 12px", fontSize: 12 }}>
          {severityLabel(circular.severity)}
        </span>
      </div>

      <div className="impact-grid">
        <div>
          <div className="section-heading">Clients affected</div>
          <div className="client-list-card">
            {sorted.map((ia) => {
              const p = ia.payload;
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
                    <span className={severityPriorityClass(p.severity)}>{severityLabel(p.severity)}</span>
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
