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

export default async function CircularsListPage() {
  const circulars = await prisma.scrapedDocument.findMany({
    where: {
      crawler: "demo",
      OR: [{ releasedAt: null }, { releasedAt: { lte: new Date() } }],
    },
    orderBy: { date: "desc" },
  });

  const impacts = await prisma.impactAnalysis.findMany({ include: { client: true } });
  const affectedByCircular = new Map<number, Array<{ name: string; severity: string }>>();
  for (const ia of impacts) {
    const p = ia.payload as { severity: string };
    if (p.severity === "not_affected") continue;
    const list = affectedByCircular.get(ia.circularId) ?? [];
    list.push({ name: ia.client.name, severity: p.severity });
    affectedByCircular.set(ia.circularId, list);
  }

  return (
    <div className="screen" style={{ maxWidth: 920, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Circulars</div>
          <div className="page-subtitle">Multi-act regulatory feed across MCA, CBDT, ICAI, EPFO, GSTN, MoL</div>
        </div>
      </div>

      {circulars.map((c) => {
        const affected = affectedByCircular.get(c.id) ?? [];
        const tag = SOURCE_TAG[c.source] ?? "tag-default";
        return (
          <Link key={c.id} href={`/circulars/${c.id}`} className="reg-card">
            <div className="reg-card-top">
              <span className={`tag ${tag}`}>{c.source}</span>
              <span style={{ fontSize: 11, color: "var(--text-light)" }}>{c.circularNumber}</span>
              <span className={`priority priority-${c.severity ?? "low"}`}>
                {SEV_LABEL[c.severity ?? "low"] ?? "Low"}
              </span>
            </div>
            <div className="reg-card-title">{c.title}</div>
            <div className="reg-card-meta">
              <span>{c.date}</span>
              <span>{c.affectedActs.join(", ")}</span>
              {c.deadlineDays && <span>Deadline: {c.deadlineDays} days</span>}
            </div>
            {c.aiSummary && (
              <div className="reg-card-summary">{c.aiSummary}</div>
            )}
            {affected.length > 0 && (
              <div className="reg-card-bottom">
                <span className="affected-text">{affected.length} client{affected.length !== 1 ? "s" : ""} affected</span>
                <div className="client-pills">
                  {affected.slice(0, 4).map((a, i) => (
                    <span key={i} className="client-pill">{a.name.split(" ").slice(0, 2).join(" ")}</span>
                  ))}
                </div>
              </div>
            )}
          </Link>
        );
      })}

      {circulars.length === 0 && (
        <div className="empty-state">No circulars yet — run npm run demo:seed to populate.</div>
      )}
    </div>
  );
}
