import { prisma } from "@/lib/prisma";
import ConcentrationChart from "@/components/ConcentrationChart";
import InteractiveStatusPill from "@/components/ui/InteractiveStatusPill";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      counterparties: { orderBy: { concentrationPct: "desc" } },
      transactions: {
        include: { counterparty: true },
        orderBy: { date: "desc" },
        take: 8,
      },
      complianceItems: {
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!client) notFound();

  const totalTxnCount = await prisma.transaction.count({ where: { clientId: client.id } });

  const chartData = client.counterparties.map((c) => ({
    name: c.name,
    value: c.concentrationPct,
    isFlagged: c.concentrationPct >= 40,
  }));

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">{client.name}</div>
          <div className="page-subtitle" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            <span>{client.sector} · ₹{client.turnoverCr} cr turnover · {client.city} · {client.ownership}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span aria-hidden style={{ color: "var(--border)" }}>•</span>
              <span className={`posture-badge posture-${client.postureBadge}`}>
                {client.postureBadge
                  .split("_")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                  .join(" ")}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="section-heading">Counterparty concentration</div>
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <ConcentrationChart data={chartData} threshold={40} />
      </div>

      <div className="section-heading">
        Recent transactions{" "}
        <span style={{ color: "var(--text-light)", fontWeight: 400, fontSize: 12 }}>
          ({client.transactions.length} of {totalTxnCount})
        </span>
      </div>
      <div className="card" style={{ padding: 0, marginBottom: 24 }}>
        <table className="list-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Counterparty</th>
              <th>Type</th>
              <th style={{ textAlign: "right" }}>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {client.transactions.map((t) => (
              <tr key={t.id}>
                <td style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "var(--text-light)" }}>
                  {t.invoiceNumber}
                </td>
                <td className="client">{t.counterparty.name}</td>
                <td style={{ textTransform: "capitalize" }}>{t.type}</td>
                <td style={{ textAlign: "right", fontWeight: 600, color: "var(--text-dark)" }}>
                  ₹{(t.amount / 1e7).toFixed(2)} cr
                </td>
                <td style={{ color: "var(--text-light)" }}>{t.date.toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-heading">Open compliance items</div>
      <div className="card" style={{ padding: 0 }}>
        {client.complianceItems.map((item, idx) => (
          <div
            key={item.id}
            style={{
              padding: "14px 18px",
              borderBottom: idx < client.complianceItems.length - 1 ? "1px solid var(--border-light)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-dark)" }}>
                {item.actionRequired}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 2 }}>
                {item.actName} · due {item.dueDate.toLocaleDateString("en-IN")}
              </div>
            </div>
            <InteractiveStatusPill itemId={item.id} initialStatus={item.status} />
          </div>
        ))}
        {client.complianceItems.length === 0 && (
          <div className="empty-state">No open items.</div>
        )}
      </div>
    </div>
  );
}
