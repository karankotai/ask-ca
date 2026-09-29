"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { severityLabel, severityPriorityClass } from "@/lib/utils";

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
  repeal: "Repealed",
  supersession: "Supersedes",
  amendment: "Amendment",
};

function riskToSeverity(level: string): "critical" | "high" | "medium" | "low" {
  const lvl = (level || "").toUpperCase();
  if (lvl === "HIGH") return "high";
  if (lvl === "MEDIUM") return "medium";
  if (lvl === "LOW") return "low";
  if (lvl === "CRITICAL") return "critical";
  return "medium";
}

function RiskBadge({ level }: { level: string }) {
  const sev = riskToSeverity(level);
  return (
    <span className={severityPriorityClass(sev)}>
      {severityLabel(sev)} Risk
    </span>
  );
}

function ChainBadge({ type }: { type: string }) {
  const style: React.CSSProperties =
    type === "repeal"
      ? { background: "var(--danger-bg)", color: "var(--danger)" }
      : type === "supersession"
      ? { background: "var(--warning-bg)", color: "var(--warning)" }
      : type === "amendment"
      ? { background: "var(--info-bg)", color: "var(--info)" }
      : { background: "var(--bg-main)", color: "var(--text-mid)" };
  return (
    <span className="obl-chain-badge" style={style}>
      {CHAIN_LABELS[type] || (type ? type[0].toUpperCase() + type.slice(1).toLowerCase() : "")}
    </span>
  );
}

function ObligationCard({ item }: { item: Obligation }) {
  const ext = item.extraction;
  const risk = ext.compliance_risk_level || "MEDIUM";
  const [expandedObls, setExpandedObls] = useState<Set<number>>(new Set([0, 1, 2]));

  const toggleObl = (i: number) => {
    setExpandedObls((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 12,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 17,
              fontWeight: 600,
              color: "var(--text-dark)",
              margin: 0,
              lineHeight: 1.4,
            }}
          >
            {ext.subject || item.title}
            {item.chain_type && <ChainBadge type={item.chain_type} />}
          </h3>
        </div>
        <RiskBadge level={risk} />
      </div>

      <div className="obl-meta-grid">
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
              Authority:
            </span>{" "}
            {ext.issuing_authority || "N/A"}
          </p>
          <p style={{ color: "var(--text-mid)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
              Circular:
            </span>{" "}
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--accent)", textDecoration: "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
              >
                {ext.circular_reference || "Link"}
              </a>
            ) : (
              <span style={{ fontFamily: "monospace", fontSize: 12 }}>
                {ext.circular_reference || "N/A"}
              </span>
            )}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
              Date Issued:
            </span>{" "}
            {ext.date_issued || "N/A"}
          </p>
          <p style={{ color: "var(--text-mid)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
              Effective:
            </span>{" "}
            {ext.effective_date || "N/A"}
          </p>
        </div>
        <div>
          <p style={{ color: "var(--text-mid)" }}>
            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
              Risk Rationale:
            </span>{" "}
            {ext.risk_rationale || "N/A"}
          </p>
        </div>
      </div>

      {ext.summary && (
        <div className="ai-card" style={{ marginBottom: 16 }}>
          {ext.summary}
        </div>
      )}

      {(item.repealed_by ||
        (ext.supersedes && ext.supersedes.length > 0) ||
        (ext.amendments_to && ext.amendments_to.length > 0)) && (
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-dark)",
              margin: "0 0 8px",
            }}
          >
            Regulatory Lineage:
          </p>
          {item.repealed_by && (
            <div
              className="obl-lineage-box"
              style={{
                border: "2px solid var(--danger)",
                background: "var(--danger-bg)",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--danger)" }}>
                Repealed
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
              className="obl-lineage-box"
              style={{
                border: "2px solid var(--warning)",
                background: "var(--warning-bg)",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--warning)" }}>
                Supersedes
              </span>
              <span style={{ color: "var(--text-dark)" }}>
                {" "}
                —{" "}
                <code
                  style={{
                    borderRadius: 4,
                    padding: "2px 6px",
                    fontSize: 11,
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
              className="obl-lineage-box"
              style={{
                border: "2px solid var(--info)",
                background: "var(--info-bg)",
              }}
            >
              <span style={{ fontWeight: 700, color: "var(--info)" }}>
                Amends
              </span>
              <span style={{ color: "var(--text-dark)" }}>
                {" "}
                — <strong>{a.regulation_name}</strong> ({a.specific_provisions})
              </span>
            </div>
          ))}
        </div>
      )}

      {ext.applies_to && ext.applies_to.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-dark)",
              margin: "0 0 8px",
            }}
          >
            Applies to:
          </p>
          <div className="flex-wrap-row">
            {ext.applies_to.map((a, i) => (
              <span key={i} className="client-pill">
                {a.entity_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {ext.obligations && ext.obligations.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-dark)",
              margin: "0 0 8px",
            }}
          >
            Compliance Obligations ({ext.obligations.length}):
          </p>
          <div className="client-list-card">
            {ext.obligations.map((obl, i) => (
              <div key={i} className="client-list-item">
                <button onClick={() => toggleObl(i)} className="obl-expand-btn">
                  <span style={{ color: "var(--text-dark)", flex: 1, minWidth: 0 }}>
                    {i + 1}. {obl.action.slice(0, 160)}
                    {obl.action.length > 160 ? "…" : ""}
                  </span>
                  <span style={{ color: "var(--text-light)", flexShrink: 0 }}>
                    {expandedObls.has(i) ? "−" : "+"}
                  </span>
                </button>
                {expandedObls.has(i) && (
                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <div className="obl-detail-grid">
                      <div>
                        {obl.deadline && (
                          <p style={{ color: "var(--text-mid)", margin: "0 0 4px" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
                              Deadline:
                            </span>{" "}
                            {obl.deadline}
                          </p>
                        )}
                        {obl.form_or_filing && (
                          <p style={{ color: "var(--text-mid)", margin: "0 0 4px" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
                              Form:
                            </span>{" "}
                            <code
                              style={{
                                borderRadius: 4,
                                padding: "2px 6px",
                                fontSize: 11,
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
                          <p style={{ color: "var(--text-mid)", margin: "0 0 4px" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
                              Penalty:
                            </span>{" "}
                            {obl.penalty_for_non_compliance}
                          </p>
                        )}
                        {obl.section_reference && (
                          <p style={{ color: "var(--text-mid)", margin: "0 0 4px" }}>
                            <span style={{ fontWeight: 500, color: "var(--text-dark)" }}>
                              Section:
                            </span>{" "}
                            {obl.section_reference}
                          </p>
                        )}
                      </div>
                    </div>
                    {obl.notes && (
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: "var(--text-light)",
                          margin: "8px 0 0",
                        }}
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

      {ext.key_thresholds && ext.key_thresholds.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--text-dark)",
              margin: "0 0 8px",
            }}
          >
            Key Thresholds:
          </p>
          <div className="flex-wrap-row">
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

  const [history, setHistory] = useState<Obligation[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [expandedObligation, setExpandedObligation] = useState<Obligation | null>(null);

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
      if (res.ok) setExpandedObligation(data);
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
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <h1 className="page-title">Extract obligations</h1>
          <p className="page-subtitle">
            Paste a PDF URL to extract structured compliance obligations using AI.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: 32 }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.rbi.org.in/path/to/circular.pdf"
          className="advisory-input"
          style={{ width: "100%", marginBottom: 16 }}
          required
        />

        <div
          style={{
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-end",
            gap: 16,
          }}
        >
          <div>
            <label
              style={{
                marginBottom: 4,
                display: "block",
                fontSize: 11,
                color: "var(--text-mid)",
              }}
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
            <div style={{ flex: 1, minWidth: 240 }}>
              <label
                style={{
                  marginBottom: 4,
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-mid)",
                }}
              >
                Repealed by
              </label>
              <input
                type="text"
                value={repealedBy}
                onChange={(e) => setRepealedBy(e.target.value)}
                placeholder="Name of replacing circular/regulation"
                className="advisory-input"
                style={{ width: "100%", paddingTop: 8, paddingBottom: 8 }}
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

      {error && (
        <div
          style={{
            marginBottom: 24,
            background: "var(--danger-bg)",
            color: "var(--danger)",
            padding: "12px 14px",
            borderRadius: 12,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div
          style={{
            marginBottom: 24,
            paddingTop: 32,
            paddingBottom: 32,
            fontSize: 13,
            color: "var(--text-mid)",
          }}
        >
          Loading… Downloading and analyzing circular… this may take 20–30
          seconds.
        </div>
      )}

      {result && <ObligationCard item={result} />}

      <div style={{ marginTop: 32 }}>
        <h2 className="section-heading" style={{ marginBottom: 16 }}>
          Past Extractions
        </h2>

        {historyLoading && !history.length ? (
          <div className="empty-state">Loading history…</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            No extractions yet. Run one above and past results will appear here.
          </div>
        ) : (
          <>
            <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 16 }}>
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
                          style={{ cursor: "pointer" }}
                        >
                          <td
                            style={{
                              color: "var(--text-mid)",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {new Date(item.created_at).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </td>
                          <td className="client">
                            {item.title || ext?.subject || "Untitled"}
                          </td>
                          <td>{ext?.issuing_authority || "—"}</td>
                          <td>{risk && <RiskBadge level={risk} />}</td>
                          <td>
                            {item.chain_type && <ChainBadge type={item.chain_type} />}
                          </td>
                        </tr>
                        {expandedId === item.id && (
                          <tr>
                            <td colSpan={5} style={{ padding: 16 }}>
                              {!expandedObligation ? (
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: "var(--text-light)",
                                    margin: 0,
                                  }}
                                >
                                  Loading…
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

            {historyTotalPages > 1 && (
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                }}
              >
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
                      style={{
                        padding: "0 8px",
                        fontSize: 13,
                        color: "var(--text-light)",
                      }}
                    >
                      …
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
