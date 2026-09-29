import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { FileText, Send, Clock, Check, Inbox } from "lucide-react";
import {
  severityLabel,
  severityPriorityClass,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  saved: "Reviewed",
  sent: "Sent",
};

export default async function BriefingsPage() {
  const comms = await prisma.draftComm.findMany({
    include: { client: true, scrapedDocument: true },
    orderBy: { createdAt: "desc" },
  });

  const impacts = await prisma.impactAnalysis.findMany({
    select: { id: true, circularId: true, clientId: true },
  });
  const iaKey = (circularId: number, clientId: string) => `${circularId}__${clientId}`;
  const iaMap = new Map(impacts.map((ia) => [iaKey(ia.circularId, ia.clientId), ia.id]));

  const drafts = comms.filter((c) => c.status === "draft");
  const reviewed = comms.filter((c) => c.status !== "draft");

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Briefings</div>
          <div className="page-subtitle">Auto-drafted client communications · pending your review</div>
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 12,
          background: drafts.length > 0 ? "var(--info-bg)" : "var(--success-bg)",
          color: drafts.length > 0 ? "var(--info)" : "var(--success)",
          fontSize: 12,
          fontWeight: 600,
        }}>
          <Inbox size={13} />
          {drafts.length > 0
            ? `${drafts.length} item${drafts.length !== 1 ? "s" : ""} pending`
            : "All clear"}
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}>
        <div className="stat-box">
          <div className="label">Pending review</div>
          <div className="value">{drafts.length}</div>
          <div className="sub warn">{drafts.length > 0 ? "Action required" : "All clear"}</div>
        </div>
        <div className="stat-box">
          <div className="label">Reviewed / sent</div>
          <div className="value">{reviewed.length}</div>
          <div className="sub muted">in this cycle</div>
        </div>
        <div className="stat-box">
          <div className="label">Total clients</div>
          <div className="value">{new Set(comms.map((c) => c.clientId)).size}</div>
          <div className="sub muted">covered by drafts</div>
        </div>
      </div>

      {drafts.length > 0 && (
        <>
          <div className="section-heading">Pending review</div>
          {drafts.map((c) => {
            const iaId = iaMap.get(iaKey(c.circularId, c.clientId));
            const href = iaId ? `/comms/${iaId}` : `/circulars/${c.circularId}/impact?client=${c.clientId}`;
            const circularSeverity = c.scrapedDocument?.severity ?? "medium";
            return (
              <Link key={c.id} href={href} className="reg-card" style={{ borderLeft: "3px solid var(--accent)" }}>
                <div className="reg-card-top">
                  <div className="advisory-icon" style={{ width: 32, height: 32, borderRadius: 8 }}>
                    <FileText size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)", lineHeight: 1.3 }}>
                      <a
                        href={`/clients/${c.clientId}`}
                        style={{ color: "var(--text-dark)", textDecoration: "none", fontWeight: 600 }}
                      >
                        {c.client.name}
                      </a>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-light)", marginTop: 2 }}>
                      Re: {c.scrapedDocument.title}
                    </div>
                  </div>
                  <span className={severityPriorityClass(circularSeverity)} style={{ fontSize: 11, padding: "3px 10px" }}>
                    {severityLabel(circularSeverity)}
                  </span>
                  <span className="priority priority-medium" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} /> {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <div className="reg-card-summary" style={{ margin: "8px 0 0", fontSize: 13 }}>
                  <strong style={{ color: "var(--text-dark)", fontWeight: 600 }}>Subject: </strong>{c.subject}
                </div>
                <div className="reg-card-bottom" style={{ marginTop: 12 }}>
                  <span className="affected-text" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Send size={12} /> Open advisory
                  </span>
                  <div className="client-pills" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span className="client-pill">{c.channel}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </>
      )}

      {comms.length > 0 && (
        <>
          <div className="section-heading" style={{ marginTop: 32 }}>Reviewed</div>
          {reviewed.length > 0 ? (
            <div className="client-list-card">
              {reviewed.map((c) => {
                const iaId = iaMap.get(iaKey(c.circularId, c.clientId));
                const href = iaId ? `/comms/${iaId}` : `/circulars/${c.circularId}/impact?client=${c.clientId}`;
                return (
                  <Link key={c.id} href={href} className="client-list-item">
                    <div className="top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="name">{c.client.name}</div>
                        <div className="meta" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.subject}
                        </div>
                      </div>
                      <span className={`priority priority-${c.status === "sent" ? "low" : "medium"}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Check size={11} /> {STATUS_LABEL[c.status]}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              No reviewed briefings yet — approve pending items above to move them here.
            </div>
          )}
        </>
      )}

      {comms.length === 0 && (
        <div className="empty-state">
          No briefings yet — they appear after impact analyses are generated for affected clients.
        </div>
      )}
    </div>
  );
}
