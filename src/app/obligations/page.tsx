"use client";

import { useState, useEffect, useCallback, Fragment } from "react";

interface Extraction {
  circular_reference?: string;
  issuing_authority?: string;
  date_issued?: string;
  effective_date?: string;
  subject?: string;
  summary?: string;
  compliance_risk_level?: string;
  risk_rationale?: string;
  applies_to?: { entity_type: string; conditions?: string | null }[];
  obligations?: {
    action: string;
    deadline?: string | null;
    penalty_for_non_compliance?: string | null;
    form_or_filing?: string | null;
    section_reference?: string | null;
    is_new?: boolean;
    notes?: string | null;
  }[];
  key_thresholds?: {
    parameter: string;
    value: string;
    context?: string;
  }[];
  supersedes?: { circular_reference: string; description?: string }[];
  amendments_to?: {
    regulation_name: string;
    specific_provisions?: string;
  }[];
}

interface Obligation {
  id: number;
  title: string;
  source_url: string;
  pdf_links: string[];
  chain_type?: string | null;
  repealed_by?: string | null;
  extraction: Extraction;
  model_used: string;
  token_count_in: number;
  token_count_out: number;
  created_at: string;
}

const CHAIN_LABELS: Record<string, string> = {
  repeal: "REPEALED",
  supersession: "SUPERSEDES",
  amendment: "AMENDMENT",
};

function RiskBadge({ level }: { level: string }) {
  const cls =
    level === "HIGH"
      ? "priority priority-critical"
      : level === "MEDIUM"
      ? "priority priority-medium"
      : level === "LOW"
      ? "priority priority-low"
      : "priority priority-low";
  return <span className={cls}>{level} RISK</span>;
}

function ChainBadge({ type }: { type: string }) {
  const style: React.CSSProperties =
    type === "repeal"
      ? {
          background: "var(--danger-bg)",
          color: "var(--danger)",
        }
      : type === "supersession"
      ? {
          background: "var(--warning-bg)",
          color: "var(--warning)",
        }
      : type === "amendment"
      ? {
          background: "var(--info-bg)",
          color: "var(--info)",
        }
      : {
          background: "var(--bg-main)",
          color: "var(--text-mid)",
        };
  return (
    <span
      className="ml-2 inline-block rounded px-2.5 py-0.5 text-xs font-semibold"
      style={style}
    >
      {CHAIN_LABELS[type] || type.toUpperCase()}
    </span>
  );
}

function ObligationCard({ item }: { item: Obligation }) {
  const ext = item.extraction;
  const risk = ext.compliance_risk_level || "MEDIUM";
  const [expandedObls, setExpandedObls] = useState<Set<number>>(
    new Set([0, 1, 2])
  );

  const toggleObl = (i: number) => {
    setExpandedObls((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="card mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3
            className="text-lg font-semibold"
            style={{ color: "var(--text-dark)" }}
          >
            {ext.subject || item.title}
            {item.chain_type && <ChainBadge type={item.chain_type} />}
          </h3>
        </div>
        <RiskBadge level={risk} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-dark)" }}
            >
              Authority:
            </span>{" "}
            {ext.issuing_authority || "N/A"}
          </p>
          <p style={{ color: "var(--text-mid)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-dark)" }}
            >
              Circular:
            </span>{" "}
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)" }}
                className="hover:underline"
              >
                {ext.circular_reference || "Link"}
              </a>
            ) : (
              <span className="font-mono text-xs">
                {ext.circular_reference || "N/A"}
              </span>
            )}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-dark)" }}
            >
              Date Issued:
            </span>{" "}
            {ext.date_issued || "N/A"}
          </p>
          <p style={{ color: "var(--text-mid)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-dark)" }}
            >
              Effective:
            </span>{" "}
            {ext.effective_date || "N/A"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--text-dark)" }}
            >
              Risk Rationale:
            </span>{" "}
            {ext.risk_rationale || "N/A"}
          </p>
        </div>
      </div>

      {/* Summary */}
      {ext.summary && <div className="ai-card mb-4">{ext.summary}</div>}

      {/* Regulatory Lineage */}
      {(item.repealed_by ||
        (ext.supersedes && ext.supersedes.length > 0) ||
        (ext.amendments_to && ext.amendments_to.length > 0)) && (
        <div className="mb-4 space-y-2">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--text-dark)" }}
          >
            Regulatory Lineage:
          </p>
          {item.repealed_by && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                border: "2px solid var(--danger)",
                background: "var(--danger-bg)",
              }}
            >
              <span className="font-bold" style={{ color: "var(--danger)" }}>
                REPEALED
              </span>
              <span style={{ color: "var(--text-dark)" }}>
                {" "}
                — This circular has been repealed and replaced by:{" "}
                <strong>{item.repealed_by}</strong>
              </span>
            </div>
          )}
          {ext.supersedes?.map((s, i) => (
            <div
              key={i}
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                border: "2px solid var(--warning)",
                background: "var(--warning-bg)",
              }}
            >
              <span className="font-bold" style={{ color: "var(--warning)" }}>
                SUPERSEDES
              </span>
              <span style={{ color: "var(--text-dark)" }}>
                {" "}
                —{" "}
                <code
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{
                    background: "var(--bg-main)",
                    color: "var(--text-dark)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {s.circular_reference}
                </code>
                : {s.description}
              </span>
            </div>
          ))}
          {ext.amendments_to?.map((a, i) => (
            <div
              key={i}
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                border: "2px solid var(--info)",
                background: "var(--info-bg)",
              }}
            >
              <span className="font-bold" style={{ color: "var(--info)" }}>
                AMENDS
              </span>
              <span style={{ color: "var(--text-dark)" }}>
                {" "}
                — <strong>{a.regulation_name}</strong> ({a.specific_provisions})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Applies to */}
      {ext.applies_to && ext.applies_to.length > 0 && (
        <div className="mb-4">
          <p
            className="mb-2 text-sm font-medium"
            style={{ color: "var(--text-dark)" }}
          >
            Applies to:
          </p>
          <div className="flex flex-wrap gap-2">
            {ext.applies_to.map((a, i) => (
              <span key={i} className="client-pill">
                {a.entity_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Obligations */}
      {ext.obligations && ext.obligations.length > 0 && (
        <div className="mb-4">
          <p
            className="mb-2 text-sm font-medium"
            style={{ color: "var(--text-dark)" }}
          >
            Compliance Obligations ({ext.obligations.length}):
          </p>
          <div className="client-list-card">
            {ext.obligations.map((obl, i) => (
              <div key={i} className="client-list-item">
                <button
                  onClick={() => toggleObl(i)}
                  className="flex w-full items-center justify-between text-left text-sm"
                >
                  <span style={{ color: "var(--text-dark)" }}>
                    {i + 1}. {obl.action.slice(0, 120)}
                    {obl.action.length > 120 ? "..." : ""}
                  </span>
                  <span
                    className="ml-2"
                    style={{ color: "var(--text-light)" }}
                  >
                    {expandedObls.has(i) ? "−" : "+"}
                  </span>
                </button>
                {expandedObls.has(i) && (
                  <div
                    className="mt-3 pt-3"
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        {obl.deadline && (
                          <p style={{ color: "var(--text-mid)" }}>
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-dark)" }}
                            >
                              Deadline:
                            </span>{" "}
                            {obl.deadline}
                          </p>
                        )}
                        {obl.form_or_filing && (
                          <p style={{ color: "var(--text-mid)" }}>
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-dark)" }}
                            >
                              Form:
                            </span>{" "}
                            <code
                              className="rounded px-1.5 py-0.5 text-xs"
                              style={{
                                background: "var(--bg-main)",
                                color: "var(--text-dark)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              {obl.form_or_filing}
                            </code>
                          </p>
                        )}
                      </div>
                      <div>
                        {obl.penalty_for_non_compliance && (
                          <p style={{ color: "var(--text-mid)" }}>
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-dark)" }}
                            >
                              Penalty:
                            </span>{" "}
                            {obl.penalty_for_non_compliance}
                          </p>
                        )}
                        {obl.section_reference && (
                          <p style={{ color: "var(--text-mid)" }}>
                            <span
                              className="font-medium"
                              style={{ color: "var(--text-dark)" }}
                            >
                              Section:
                            </span>{" "}
                            {obl.section_reference}
                          </p>
                        )}
                      </div>
                    </div>
                    {obl.notes && (
                      <p
                        className="mt-2 text-xs"
                        style={{ color: "var(--text-light)" }}
                      >
                        Note: {obl.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key thresholds */}
      {ext.key_thresholds && ext.key_thresholds.length > 0 && (
        <div>
          <p
            className="mb-2 text-sm font-medium"
            style={{ color: "var(--text-dark)" }}
          >
            Key Thresholds:
          </p>
          <div className="flex flex-wrap gap-2">
            {ext.key_thresholds.map((t, i) => (
              <span
                key={i}
                className="tag tag-default"
                style={{
                  background: "var(--info-bg)",
                  color: "var(--info)",
                  borderColor: "var(--info)",
                }}
              >
                <strong>{t.parameter}:</strong> {t.value}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ObligationsPage() {
  const [url, setUrl] = useState("");
  const [chainType, setChainType] = useState<string>("");
  const [repealedBy, setRepealedBy] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Obligation | null>(null);

  // History
  const [history, setHistory] = useState<Obligation[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedObligation, setExpandedObligation] =
    useState<Obligation | null>(null);

  const fetchHistory = useCallback(async (page: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/obligations?page=${page}&limit=10`);
      const data = await res.json();
      if (res.ok) {
        setHistory(data.obligations);
        setHistoryPage(data.page);
        setHistoryTotalPages(data.total_pages);
      }
    } catch (e) {
      console.error("[obligations] fetchHistory failed", e);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || !url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const body: Record<string, string> = { url: url.trim() };
      if (chainType) body.chain_type = chainType;
      if (repealedBy.trim()) body.repealed_by = repealedBy.trim();

      const res = await fetch("/api/obligations/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Extraction failed.");
        return;
      }

      setResult(data.obligation);
      fetchHistory(1);
    } catch (e) {
      console.error("[obligations] handleSubmit failed", e);
      setError("Could not connect to extraction service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRowClick(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedObligation(null);
      return;
    }
    setExpandedId(id);
    setExpandedObligation(null);
    try {
      const res = await fetch(`/api/obligations/${id}`);
      const data = await res.json();
      if (res.ok) {
        setExpandedObligation(data);
      }
    } catch (e) {
      console.error("[obligations] handleRowClick failed", e);
    }
  }

  const goToHistoryPage = (p: number) => {
    if (p < 1 || p > historyTotalPages) return;
    setHistoryPage(p);
    fetchHistory(p);
  };

  const historyPageNumbers = (): (number | "...")[] => {
    if (historyTotalPages <= 7)
      return Array.from({ length: historyTotalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (historyPage > 3) pages.push("...");
    for (
      let i = Math.max(2, historyPage - 1);
      i <= Math.min(historyTotalPages - 1, historyPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (historyPage < historyTotalPages - 2) pages.push("...");
    pages.push(historyTotalPages);
    return pages;
  };

  return (
    <div className="screen" style={{ maxWidth: 980, margin: "0 auto" }}>
      <div className="page-row">
        <h1 className="page-title">Obligation Extractor</h1>
        <p className="page-subtitle">
          Paste a PDF URL to extract structured compliance obligations using AI.
        </p>
      </div>

      {/* Extraction Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.rbi.org.in/path/to/circular.pdf"
          className="advisory-input mb-4 w-full"
          required
        />

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <div>
            <label
              className="mb-1 block text-xs"
              style={{ color: "var(--text-mid)" }}
            >
              Chain Type (optional)
            </label>
            <select
              value={chainType}
              onChange={(e) => setChainType(e.target.value)}
              className="advisory-input"
              style={{ width: "auto", paddingTop: 8, paddingBottom: 8 }}
            >
              <option value="">Standalone</option>
              <option value="repeal">Repeal</option>
              <option value="supersession">Supersession</option>
              <option value="amendment">Amendment</option>
            </select>
          </div>

          {chainType === "repeal" && (
            <div className="flex-1">
              <label
                className="mb-1 block text-xs"
                style={{ color: "var(--text-mid)" }}
              >
                Repealed by
              </label>
              <input
                type="text"
                value={repealedBy}
                onChange={(e) => setRepealedBy(e.target.value)}
                placeholder="Name of replacing circular/regulation"
                className="advisory-input w-full"
                style={{ paddingTop: 8, paddingBottom: 8 }}
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn btn-primary"
        >
          {loading ? "Extracting..." : "Extract Obligations"}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div
          className="mb-6 rounded-xl text-sm"
          style={{
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "12px 14px",
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div
          className="mb-6 py-8 text-sm"
          style={{ color: "var(--text-mid)" }}
        >
          Loading... Downloading and analyzing circular... this may take 20-30
          seconds.
        </div>
      )}

      {/* Result */}
      {result && <ObligationCard item={result} />}

      {/* History Table */}
      <div className="mt-8">
        <h2 className="section-heading mb-4">Past Extractions</h2>

        {historyLoading && !history.length ? (
          <p className="text-sm" style={{ color: "var(--text-light)" }}>
            Loading history...
          </p>
        ) : history.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-light)" }}>
            No extractions yet.
          </p>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="list-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Title</th>
                    <th>Authority</th>
                    <th>Risk</th>
                    <th>Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const ext = item.extraction as Extraction;
                    const risk = ext?.compliance_risk_level || "";
                    return (
                      <Fragment key={item.id}>
                        <tr
                          onClick={() => handleRowClick(item.id)}
                          className="cursor-pointer"
                        >
                          <td className="whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="max-w-xs truncate">
                            {item.title || ext?.subject || "Untitled"}
                          </td>
                          <td>{ext?.issuing_authority || "—"}</td>
                          <td>{risk && <RiskBadge level={risk} />}</td>
                          <td>
                            {item.chain_type && (
                              <ChainBadge type={item.chain_type} />
                            )}
                          </td>
                        </tr>
                        {expandedId === item.id && (
                          <tr>
                            <td colSpan={5} style={{ padding: 16 }}>
                              {!expandedObligation ? (
                                <p
                                  className="text-sm"
                                  style={{ color: "var(--text-light)" }}
                                >
                                  Loading...
                                </p>
                              ) : (
                                <ObligationCard item={expandedObligation} />
                              )}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => goToHistoryPage(historyPage - 1)}
                  disabled={historyPage === 1}
                  className="btn btn-outline"
                >
                  Prev
                </button>

                {historyPageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span
                      key={`e${i}`}
                      className="px-2 text-sm"
                      style={{ color: "var(--text-light)" }}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToHistoryPage(p)}
                      className={
                        p === historyPage ? "btn btn-primary" : "btn btn-outline"
                      }
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToHistoryPage(historyPage + 1)}
                  disabled={historyPage === historyTotalPages}
                  className="btn btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
