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

type CircularListParams = {
  q?: string;
  source?: string;
  severity?: string;
  act?: string;
};

function sanitizeFilters(raw: Record<string, string | string[] | undefined>): CircularListParams {
  return {
    q: typeof raw.q === "string" && raw.q.trim() !== "" ? raw.q.trim() : undefined,
    source: typeof raw.source === "string" && raw.source !== "all" && raw.source !== "" ? raw.source : undefined,
    severity: typeof raw.severity === "string" && raw.severity !== "all" && raw.severity !== "" ? raw.severity : undefined,
    act: typeof raw.act === "string" && raw.act !== "all" && raw.act !== "" ? raw.act : undefined,
  };
}

export default async function CircularsListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = sanitizeFilters(await searchParams);

  const allDocs = await prisma.scrapedDocument.findMany({
    where: { crawler: "demo" },
    orderBy: { date: "desc" },
    select: { source: true, affectedActs: true, severity: true },
  });

  const availableSources = Array.from(new Set(allDocs.map((d) => d.source).filter(Boolean)));
  const availableSeverities = Array.from(new Set(allDocs.map((d) => d.severity).filter(Boolean) as string[]));
  const availableActs = Array.from(new Set(allDocs.flatMap((d) => d.affectedActs ?? []))).slice(0, 24);

  const where = {
    crawler: "demo",
    OR: [{ releasedAt: null }, { releasedAt: { lte: new Date() } }],
    ...(params.source ? { source: params.source } : {}),
    ...(params.severity ? { severity: params.severity } : {}),
    ...(params.act ? { affectedActs: { has: params.act } } : {}),
  } satisfies Record<string, unknown>;

  const searchTerms = params.q
    ? params.q
        .toLowerCase()
        .split(/\s+/)
        .filter((t) => t.length > 0)
    : [];

  const unfilteredCirculars = await prisma.scrapedDocument.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const circulars = searchTerms.length === 0
    ? unfilteredCirculars
    : unfilteredCirculars.filter((c) => {
        const hay = [
          c.title,
          c.details,
          c.aiSummary,
          c.content,
          c.circularNumber,
          c.department,
          (c.affectedActs ?? []).join(" "),
          c.source,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return searchTerms.every((t) => hay.includes(t));
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

  const filterSummary: string[] = [];
  if (params.q) filterSummary.push(`"${params.q}"`);
  if (params.source) filterSummary.push(`source:${params.source}`);
  if (params.severity) filterSummary.push(`severity:${params.severity}`);
  if (params.act) filterSummary.push(`act:${params.act}`);

  return (
    <div className="screen" style={{ maxWidth: 920, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Circulars</div>
          <div className="page-subtitle">
            Multi-act regulatory feed across MCA, CBDT, ICAI, EPFO, GSTN, MoL · Showing {circulars.length} result
            {circulars.length !== 1 ? "s" : ""}
            {filterSummary.length > 0 && <> · filters: {filterSummary.join(" · ")}</>}
          </div>
        </div>
        {filterSummary.length > 0 && (
          <Link href="/circulars" className="btn btn-outline">Clear filters</Link>
        )}
      </div>

      <form
        method="GET"
        action="/circulars"
        className="filters"
        style={{
          background: "var(--bg-white)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 14px",
        }}
      >
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search titles, summaries, acts…"
          style={{
            flex: 1,
            minWidth: 220,
            padding: "9px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            fontSize: 13,
            background: "var(--bg-main)",
            color: "var(--text-dark)",
            fontFamily: "inherit",
            outline: "none",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
        />
        <select
          name="source"
          defaultValue={params.source ?? "all"}
          aria-label="Filter by source"
        >
          <option value="all">All sources</option>
          {availableSources.map((s) => (
            <option key={s as string} value={s as string}>{s as string}</option>
          ))}
        </select>
        <select
          name="severity"
          defaultValue={params.severity ?? "all"}
          aria-label="Filter by severity"
        >
          <option value="all">All severities</option>
          {availableSeverities.map((s) => (
            <option key={s} value={s}>{SEV_LABEL[s] ?? s}</option>
          ))}
        </select>
        <select
          name="act"
          defaultValue={params.act ?? "all"}
          aria-label="Filter by act"
        >
          <option value="all">All acts</option>
          {availableActs.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        <button
          type="button"
          onClick={() => {
            window.location.href = "/circulars";
          }}
          className="btn btn-outline"
        >
          Reset
        </button>
        <span className="progress">
          {circulars.length} / {unfilteredCirculars.length} match{(circulars.length !== 1) && "es"}
        </span>
      </form>

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
        <div className="empty-state">
          No circulars match your filters — try adjusting them or{" "}
          <Link href="/circulars" style={{ color: "var(--accent)", textDecoration: "none" }}>
            clear filters
          </Link>
          .
        </div>
      )}
    </div>
  );
}
