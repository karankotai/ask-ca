import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Calendar, Building2, Clock, AlertTriangle, Sparkles, Users } from "lucide-react";
import LiveDropTimerWrapper from "./LiveDropTimerWrapper";

export const dynamic = "force-dynamic";

const STATIC_FOCUS_CIRCULAR_NUMBER = "MOL/2026/FA-SHIFT-01";

const SOURCE_TAG: Record<string, string> = {
  MCA: "tag-mca",
  CBDT: "tag-cbdt",
  ICAI: "tag-icai",
  EPFO: "tag-epfo",
  GSTN: "tag-gstn",
  "Min. of Labour": "tag-mol",
};

function timeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)} min ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} hours ago`;
  return `${Math.floor(sec / 86400)} days ago`;
}

export default async function CircularDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (Number.isNaN(id)) notFound();

  const circular = await prisma.scrapedDocument.findUnique({ where: { id } });
  if (!circular) notFound();

  const impacts = await prisma.impactAnalysis.findMany({
    where: { circularId: id },
    include: { client: true },
  });
  const affectedClients = impacts.filter((i) => {
    const p = i.payload as { severity: string };
    return p.severity !== "not_affected";
  });

  const isFocusCircular = circular.circularNumber === STATIC_FOCUS_CIRCULAR_NUMBER;
  const isLiveDrop = circular.isLiveDrop;
  const liveDrop = isFocusCircular
    ? await prisma.scrapedDocument.findFirst({ where: { isLiveDrop: true }, select: { id: true } })
    : null;

  const tag = SOURCE_TAG[circular.source] ?? "tag-default";
  const releasedAt = circular.releasedAt ?? circular.createdAt;
  const ago = timeAgo(releasedAt);

  const deadline = circular.deadlineDays
    ? new Date(Date.now() + circular.deadlineDays * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : "—";

  return (
    <div className="screen" style={{ maxWidth: 920, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <Link href="/circulars" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none" }}>← Back to circulars</Link>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        {(isLiveDrop || ago.includes("min") || ago.includes("hours")) && <span className="new-badge">New</span>}
        <span className={`tag ${tag}`}>{circular.source}</span>
        <span style={{ fontSize: 12, color: "var(--text-light)" }}>{circular.circularNumber}</span>
        <span style={{ fontSize: 12, color: "var(--text-light)" }}>·</span>
        <span style={{ fontSize: 12, color: "var(--text-light)" }}>Published {ago}</span>
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3, marginBottom: 18 }}>{circular.title}</h1>

      {circular.aiSummary && (
        <div className="ai-card">
          <div className="ai-card-header">
            <Sparkles size={16} color="var(--accent)" />
            <span>AI Interpretation</span>
          </div>
          <div className="ai-card-body">{circular.aiSummary}</div>
        </div>
      )}

      <div className="info-chips">
        <div className="info-chip">
          <div className="ic-label"><Calendar size={14} /> Effective Date</div>
          <div className="ic-value">{circular.date}</div>
        </div>
        <div className="info-chip">
          <div className="ic-label"><Building2 size={14} /> Affected Acts</div>
          <div className="ic-value">{circular.affectedActs.join(", ") || "—"}</div>
        </div>
        <div className="info-chip">
          <div className="ic-label"><Clock size={14} /> Deadline</div>
          <div className="ic-value">{deadline}</div>
        </div>
        <div className="info-chip">
          <div className="ic-label"><AlertTriangle size={14} /> Severity</div>
          <div className="ic-value" style={{ textTransform: "capitalize" }}>{circular.severity ?? "—"}</div>
        </div>
      </div>

      <div className="affected-block">
        <div className="affected-block-header">
          <div className="label">
            <Users size={16} color="var(--text-mid)" />
            <span>Affected Clients</span>
          </div>
          <span className="affected-count">
            {affectedClients.length} of {impacts.length}
          </span>
        </div>
        <div className="affected-list">
          {affectedClients.length === 0 && <span style={{ fontSize: 12, color: "var(--text-light)" }}>No clients affected.</span>}
          {affectedClients.map((ia) => (
            <Link key={ia.id} href={`/circulars/${id}/impact?client=${ia.clientId}`} className="affected-pill">
              {ia.client.name.split(" ").slice(0, 2).join(" ")}
            </Link>
          ))}
        </div>
        {affectedClients.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <Link href={`/circulars/${id}/impact`} className="btn btn-primary">View client impact →</Link>
          </div>
        )}
      </div>

      {circular.content && (
        <div style={{ marginTop: 24 }}>
          <div className="section-heading">Full text</div>
          <div className="card-soft" style={{ fontSize: 13, lineHeight: 1.7, color: "var(--text-mid)", whiteSpace: "pre-wrap" }}>
            {circular.content}
          </div>
        </div>
      )}

      {isFocusCircular && liveDrop && (
        <LiveDropTimerWrapper liveDropId={liveDrop.id} />
      )}
    </div>
  );
}
