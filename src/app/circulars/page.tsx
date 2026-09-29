import { prisma } from "@/lib/prisma";
import {
  severityLabel,
  severityPriorityClass,
  deadlineFromPublished,
  stripCircularNumberPrefix,
  type DeadlineInfo,
} from "@/lib/utils";
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

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0, high: 1, medium: 2, low: 3, not_affected: 4,
};

type CircularListParams = {
  q?: string;
  source?: string;
  severity?: string;
  act?: string;
  sort?: "latest" | "critical" | "urgent";
};

const VALID_SORTS: CircularListParams["sort"][] = ["latest", "critical", "urgent"];

function sanitizeFilters(raw: Record<string, string | string[] | undefined>): CircularListParams {
  const sortRaw = typeof raw.sort === "string" ? raw.sort : undefined;
  return {
    q: typeof raw.q === "string" && raw.q.trim() !== "" ? raw.q.trim() : undefined,
    source: typeof raw.source === "string" && raw.source !== "all" && raw.source !== "" ? raw.source : undefined,
    severity: typeof raw.severity === "string" && raw.severity !== "all" && raw.severity !== "" ? raw.severity : undefined,
    act: typeof raw.act === "string" && raw.act !== "all" && raw.act !== "" ? raw.act : undefined,
    sort: sortRaw && (VALID_SORTS as readonly string[]).includes(sortRaw) ? (sortRaw as CircularListParams["sort"]) : "latest",
  };
}

function deadlineDate(c: { releasedAt: Date | null; createdAt: Date; deadlineDays: number | null }): DeadlineInfo {
  return deadlineFromPublished(c.releasedAt ?? c.createdAt, c.deadlineDays);
}

function sortCirculars<T extends {
  releasedAt: Date | null;
  createdAt: Date;
  deadlineDays: number | null;
  severity: string | null;
  date: string | null;
}>(list: T[], sort: CircularListParams["sort"]): T[] {
  if (sort === "critical") {
    return [...list].sort((a, b) => {
      const sa = SEVERITY_ORDER[a.severity ?? "low"] ?? 5;
      const sb = SEVERITY_ORDER[b.severity ?? "low"] ?? 5;
      if (sa !== sb) return sa - sb;
      const ta = (a.releasedAt ?? a.createdAt).getTime();
      const tb = (b.releasedAt ?? b.createdAt).getTime();
      return tb - ta;
    });
  }
  if (sort === "urgent") {
    return [...list].sort((a, b) => {
      const da = deadlineDate(a);
      const db = deadlineDate(b);
      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;
      if (da.isOverdue !== db.isOverdue) return da.isOverdue ? -1 : 1;
      const ad = new Date(da.absolute).getTime();
      const bd = new Date(db.absolute).getTime();
      if (da.isOverdue) return ad - bd;
      return ad - bd;
    });
  }
  return [...list].sort((a, b) => {
    const ta = (a.releasedAt ?? a.createdAt).getTime();
    const tb = (b.releasedAt ?? b.createdAt).getTime();
    return tb - ta;
  });
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

  const circulars = sortCirculars(
    (searchTerms.length === 0
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
        })),
    params.sort,
  );

  const impacts = await prisma.impactAnalysis.findMany({ include: { client: true } });
  const affectedByCircular = new Map<number, Array<{ clientId: string; name: string; severity: string }>>();
  for (const ia of impacts) {
    const p = ia.payload as { severity: string };
    if (p.severity === "not_affected") continue;
    const list = affectedByCircular.get(ia.circularId) ?? [];
    list.push({ clientId: ia.client.id, name: ia.client.name, severity: p.severity });
    affectedByCircular.set(ia.circularId, list);
  }

  const filterSummary: string[] = [];
  if (params.q) filterSummary.push(`"${params.q}"`);
  if (params.source) filterSummary.push(`source:${params.source}`);
  if (params.severity) filterSummary.push(`severity:${params.severity}`);
  if (params.act) filterSummary.push(`act:${params.act}`);
  const SORT_LABEL: Record<NonNullable<CircularListParams["sort"]>, string> = {
    latest: "Latest",
    critical: "Most critical",
    urgent: "Urgent first",
  };
  if (params.sort && params.sort !== "latest") filterSummary.push(`sort:${SORT_LABEL[params.sort]}`);

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
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
          className="circulars-search"
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
            <option key={s} value={s}>{severityLabel(s)}</option>
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
        <select
          name="sort"
          defaultValue={params.sort ?? "latest"}
          aria-label="Sort circulars"
        >
          <option value="latest">Latest first</option>
          <option value="critical">Most critical</option>
          <option value="urgent">Urgent first</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
        <Link href="/circulars" className="btn btn-outline">
          Reset
        </Link>
        <span className="progress">
          {circulars.length} / {unfilteredCirculars.length} match{(circulars.length !== 1) && "es"}
        </span>
      </form>

      {circulars.map((c) => {
        const affected = affectedByCircular.get(c.id) ?? [];
        const tag = SOURCE_TAG[c.source] ?? "tag-default";
        const circNum = stripCircularNumberPrefix(c.source, c.circularNumber);
        const deadline = deadlineDate(c);
        return (
          <Link key={c.id} href={`/circulars/${c.id}`} className="reg-card">
            <div className="reg-card-top">
              <span className={`tag ${tag}`}>{c.source}</span>
              {circNum && <span style={{ fontSize: 11, color: "var(--text-light)" }}>{circNum}</span>}
              <span className={severityPriorityClass(c.severity)}>
                {severityLabel(c.severity)}
              </span>
            </div>
            <div className="reg-card-title">{c.title}</div>
            <div className="reg-card-meta">
              <span>{c.date}</span>
              <span>{c.affectedActs.join(", ")}</span>
              {deadline && (
                <span style={{
                  color: deadline.isOverdue ? "var(--danger)" : deadline.isToday ? "var(--warning)" : "var(--text-mid)",
                  fontWeight: deadline.dueSoon ? 600 : 400,
                }}>
                  {deadline.relative} · {deadline.absolute}
                </span>
              )}
            </div>
            {c.aiSummary && (
              <div className="reg-card-summary">{c.aiSummary}</div>
            )}
            {affected.length > 0 && (
              <div className="reg-card-bottom">
                <span className="affected-text">{affected.length} client{affected.length !== 1 ? "s" : ""} affected</span>
                <div className="client-pills">
                  {affected.slice(0, 4).map((a, i) => (
                    <Link
                      key={`${a.clientId}-${i}`}
                      href={`/clients/${a.clientId}`}
                      className="client-pill client-pill-link"
                    >{a.name.split(" ").slice(0, 2).join(" ")}</Link>
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
