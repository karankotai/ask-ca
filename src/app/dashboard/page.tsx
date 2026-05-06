import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const SOURCE_TAG: Record<string, string> = {
  MCA: "tag-mca",
  CBDT: "tag-cbdt",
  ICAI: "tag-icai",
  EPFO: "tag-epfo",
  GSTN: "tag-gstn",
  "Min. of Labour": "tag-mol",
};

const SEV_LABEL: Record<string, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export default async function DashboardPage() {
  const clients = await prisma.client.findMany({
    include: {
      complianceItems: {
        where: { status: { in: ["pending", "in_progress", "overdue"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const flaggedClients = clients.filter((c) =>
    c.complianceItems.some((i) => i.severity === "critical" || i.severity === "high"),
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCirculars = await prisma.scrapedDocument.findMany({
    where: {
      crawler: "demo",
      releasedAt: { not: null, gte: sevenDaysAgo, lte: new Date() },
    },
    orderBy: { releasedAt: "desc" },
  });

  const impacts = await prisma.impactAnalysis.findMany({ include: { client: true } });
  const totalExposureRupees = impacts.reduce((sum, i) => {
    const payload = i.payload as { totalAmount?: number };
    return sum + (payload.totalAmount ?? 0);
  }, 0);
  const totalExposureCr = (totalExposureRupees / 1e7).toFixed(0);

  // Build per-circular affected-client list for priority cards
  const affectedByCircular = new Map<number, Array<{ name: string; severity: string }>>();
  for (const ia of impacts) {
    const p = ia.payload as { severity: string };
    if (p.severity === "not_affected") continue;
    const list = affectedByCircular.get(ia.circularId) ?? [];
    list.push({ name: ia.client.name, severity: p.severity });
    affectedByCircular.set(ia.circularId, list);
  }

  // Sort: items needing attention today (5)
  const allOpenItems = clients
    .flatMap((c) => c.complianceItems.map((i) => ({ client: c, item: i })))
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sevOrder[a.item.severity] ?? 4) - (sevOrder[b.item.severity] ?? 4);
    })
    .slice(0, 5);

  return (
    <div className="screen">
      <div className="page-row">
        <div>
          <div className="page-title">Good morning.</div>
          <div className="page-subtitle">Here&apos;s what changed since Friday.</div>
        </div>
      </div>

      <div className="stats">
        <div className="stat-box clickable">
          <div className="label">Clients flagged</div>
          <div className="value">{flaggedClients.length}</div>
          <div className="sub warn">{flaggedClients.length > 0 ? "Action required" : "All on track"}</div>
        </div>
        <div className="stat-box clickable">
          <div className="label">New circulars (7d)</div>
          <div className="value">{recentCirculars.length}</div>
          <div className="sub muted">across {new Set(recentCirculars.flatMap((c) => c.affectedActs)).size} acts</div>
        </div>
        <div className="stat-box clickable">
          <div className="label">Total exposure</div>
          <div className="value">₹{totalExposureCr} cr</div>
          <div className="sub muted">across affected transactions</div>
        </div>
        <div className="stat-box clickable">
          <div className="label">Open items</div>
          <div className="value">{allOpenItems.length > 0 ? clients.reduce((s, c) => s + c.complianceItems.length, 0) : 0}</div>
          <div className="sub muted">across all clients</div>
        </div>
      </div>

      <div className="two-col">
        <div>
          <div className="section-heading">Recent circulars</div>
          {recentCirculars.slice(0, 4).map((c) => {
            const affected = affectedByCircular.get(c.id) ?? [];
            const tag = SOURCE_TAG[c.source] ?? "tag-default";
            return (
              <Link key={c.id} href={`/circulars/${c.id}`} className="reg-card">
                <div className="reg-card-top">
                  <span className={`tag ${tag}`}>{c.source}</span>
                  <span className={`priority priority-${c.severity ?? "low"}`}>
                    {SEV_LABEL[c.severity ?? "low"] ?? "Low"}
                  </span>
                </div>
                <div className="reg-card-title">{c.title}</div>
                <div className="reg-card-meta">
                  <span>{c.date}</span>
                  <span>{c.affectedActs.join(", ")}</span>
                </div>
                {affected.length > 0 && (
                  <div className="reg-card-bottom">
                    <span className="affected-text">{affected.length} client{affected.length !== 1 ? "s" : ""} affected</span>
                    <div className="client-pills">
                      {affected.slice(0, 3).map((a, i) => (
                        <span key={i} className="client-pill">{a.name.split(" ")[0]}</span>
                      ))}
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        <div>
          <div className="section-heading">Needs attention today</div>
          <div className="deadlines">
            {allOpenItems.length === 0 && <div className="empty-state">No open items.</div>}
            {allOpenItems.map(({ client, item }) => {
              const due = new Date(item.dueDate);
              const isOverdue = due < new Date();
              return (
                <Link
                  key={item.id}
                  href={`/clients/${client.id}`}
                  className={`dl-item ${isOverdue ? "overdue" : ""}`}
                >
                  <div className="dl-date">
                    <div className="day">{due.getDate()}</div>
                    <div className="mon">{due.toLocaleDateString("en-IN", { month: "short" })}</div>
                  </div>
                  <div className="dl-info">
                    <div className="title">{item.actionRequired}</div>
                    <div className="sub">{client.name} · {item.actName}</div>
                  </div>
                  <span className={`dl-status ${item.status === "done" ? "dl-done" : isOverdue ? "dl-overdue" : "dl-pending"}`}>
                    {item.severity}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
