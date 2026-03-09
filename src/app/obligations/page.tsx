"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import Link from "next/link";

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

const RISK_STYLES: Record<string, string> = {
  HIGH: "bg-red-600 text-white",
  MEDIUM: "bg-orange-500 text-white",
  LOW: "bg-green-600 text-white",
};

const CHAIN_LABELS: Record<string, string> = {
  repeal: "REPEALED",
  supersession: "SUPERSEDES",
  amendment: "AMENDMENT",
};

const CHAIN_BADGE_STYLES: Record<string, string> = {
  repeal: "bg-red-600 text-white",
  supersession: "bg-amber-500 text-white",
  amendment: "bg-blue-600 text-white",
};

function RiskBadge({ level }: { level: string }) {
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
        RISK_STYLES[level] || "bg-zinc-600 text-white"
      }`}
    >
      {level} RISK
    </span>
  );
}

function ChainBadge({ type }: { type: string }) {
  return (
    <span
      className={`ml-2 inline-block rounded px-2.5 py-0.5 text-xs font-semibold ${
        CHAIN_BADGE_STYLES[type] || "bg-zinc-600 text-white"
      }`}
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
    <div className="rounded-xl bg-[#2f2f2f] p-5 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">
            {ext.subject || item.title}
            {item.chain_type && <ChainBadge type={item.chain_type} />}
          </h3>
        </div>
        <RiskBadge level={risk} />
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">Authority:</span>{" "}
            {ext.issuing_authority || "N/A"}
          </p>
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">Circular:</span>{" "}
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
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
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">Date Issued:</span>{" "}
            {ext.date_issued || "N/A"}
          </p>
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">Effective:</span>{" "}
            {ext.effective_date || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-zinc-400">
            <span className="font-medium text-zinc-300">Risk Rationale:</span>{" "}
            {ext.risk_rationale || "N/A"}
          </p>
        </div>
      </div>

      {/* Summary */}
      {ext.summary && (
        <div className="mb-4 rounded-lg bg-blue-900/20 border border-blue-800/30 px-4 py-3 text-sm text-blue-200">
          {ext.summary}
        </div>
      )}

      {/* Regulatory Lineage */}
      {(item.repealed_by ||
        (ext.supersedes && ext.supersedes.length > 0) ||
        (ext.amendments_to && ext.amendments_to.length > 0)) && (
        <div className="mb-4 space-y-2">
          <p className="text-sm font-medium text-zinc-300">
            Regulatory Lineage:
          </p>
          {item.repealed_by && (
            <div className="rounded-lg border-2 border-red-600 bg-red-900/10 px-4 py-3 text-sm">
              <span className="font-bold text-red-400">REPEALED</span>
              <span className="text-zinc-300">
                {" "}
                — This circular has been repealed and replaced by:{" "}
                <strong>{item.repealed_by}</strong>
              </span>
            </div>
          )}
          {ext.supersedes?.map((s, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-amber-500 bg-amber-900/10 px-4 py-3 text-sm"
            >
              <span className="font-bold text-amber-400">SUPERSEDES</span>
              <span className="text-zinc-300">
                {" "}
                —{" "}
                <code className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs">
                  {s.circular_reference}
                </code>
                : {s.description}
              </span>
            </div>
          ))}
          {ext.amendments_to?.map((a, i) => (
            <div
              key={i}
              className="rounded-lg border-2 border-blue-500 bg-blue-900/10 px-4 py-3 text-sm"
            >
              <span className="font-bold text-blue-400">AMENDS</span>
              <span className="text-zinc-300">
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
          <p className="mb-2 text-sm font-medium text-zinc-300">Applies to:</p>
          <div className="flex flex-wrap gap-2">
            {ext.applies_to.map((a, i) => (
              <span
                key={i}
                className="inline-block rounded-full border border-purple-500/30 bg-purple-900/20 px-3 py-1 text-xs text-purple-200"
              >
                {a.entity_type}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Obligations */}
      {ext.obligations && ext.obligations.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-zinc-300">
            Compliance Obligations ({ext.obligations.length}):
          </p>
          <div className="space-y-2">
            {ext.obligations.map((obl, i) => (
              <div
                key={i}
                className="rounded-lg border border-zinc-700 bg-[#262626]"
              >
                <button
                  onClick={() => toggleObl(i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
                >
                  <span className="text-zinc-200">
                    {i + 1}. {obl.action.slice(0, 120)}
                    {obl.action.length > 120 ? "..." : ""}
                  </span>
                  <span className="ml-2 text-zinc-500">
                    {expandedObls.has(i) ? "−" : "+"}
                  </span>
                </button>
                {expandedObls.has(i) && (
                  <div className="border-t border-zinc-700 px-4 py-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        {obl.deadline && (
                          <p className="text-zinc-400">
                            <span className="font-medium text-zinc-300">
                              Deadline:
                            </span>{" "}
                            {obl.deadline}
                          </p>
                        )}
                        {obl.form_or_filing && (
                          <p className="text-zinc-400">
                            <span className="font-medium text-zinc-300">
                              Form:
                            </span>{" "}
                            <code className="rounded bg-zinc-700 px-1.5 py-0.5 text-xs">
                              {obl.form_or_filing}
                            </code>
                          </p>
                        )}
                      </div>
                      <div>
                        {obl.penalty_for_non_compliance && (
                          <p className="text-zinc-400">
                            <span className="font-medium text-zinc-300">
                              Penalty:
                            </span>{" "}
                            {obl.penalty_for_non_compliance}
                          </p>
                        )}
                        {obl.section_reference && (
                          <p className="text-zinc-400">
                            <span className="font-medium text-zinc-300">
                              Section:
                            </span>{" "}
                            {obl.section_reference}
                          </p>
                        )}
                      </div>
                    </div>
                    {obl.notes && (
                      <p className="mt-2 text-xs text-zinc-500">
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
          <p className="mb-2 text-sm font-medium text-zinc-300">
            Key Thresholds:
          </p>
          <div className="flex flex-wrap gap-2">
            {ext.key_thresholds.map((t, i) => (
              <span
                key={i}
                className="inline-block rounded-full border border-sky-500/30 bg-sky-900/20 px-3 py-1 text-xs text-sky-200"
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
    } catch {
      // silent
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
    } catch {
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
    } catch {
      // silent
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
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-200">
            Chat
          </Link>
          <Link
            href="/circulars"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Circulars
          </Link>
          <Link
            href="/evaluate"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Evaluate
          </Link>
          <Link
            href="/analyze"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Analyze
          </Link>
          <span className="text-sm font-medium text-white">Obligations</span>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Obligation Extractor</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Paste a PDF URL to extract structured compliance obligations using
            AI.
          </p>
        </div>

        {/* Extraction Form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.rbi.org.in/path/to/circular.pdf"
            className="mb-4 w-full rounded-xl bg-[#2f2f2f] px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
            required
          />

          <div className="mb-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs text-zinc-400">
                Chain Type (optional)
              </label>
              <select
                value={chainType}
                onChange={(e) => setChainType(e.target.value)}
                className="rounded-lg bg-[#2f2f2f] px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <option value="">Standalone</option>
                <option value="repeal">Repeal</option>
                <option value="supersession">Supersession</option>
                <option value="amendment">Amendment</option>
              </select>
            </div>

            {chainType === "repeal" && (
              <div className="flex-1">
                <label className="mb-1 block text-xs text-zinc-400">
                  Repealed by
                </label>
                <input
                  type="text"
                  value={repealedBy}
                  onChange={(e) => setRepealedBy(e.target.value)}
                  placeholder="Name of replacing circular/regulation"
                  className="w-full rounded-lg bg-[#2f2f2f] px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-xl bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-zinc-200 disabled:opacity-30"
          >
            {loading ? "Extracting..." : "Extract Obligations"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mb-6 flex items-center gap-3 py-8">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
            </div>
            <span className="text-sm text-zinc-400">
              Downloading and analyzing circular... this may take 20-30 seconds.
            </span>
          </div>
        )}

        {/* Result */}
        {result && <ObligationCard item={result} />}

        {/* History Table */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Past Extractions</h2>

          {historyLoading && !history.length ? (
            <p className="text-sm text-zinc-500">Loading history...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-zinc-500">No extractions yet.</p>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-zinc-800">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-[#2a2a2a]">
                    <tr>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Date
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Title
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Authority
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Risk
                      </th>
                      <th className="px-4 py-3 font-medium text-zinc-400">
                        Chain
                      </th>
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
                            className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-[#2f2f2f]"
                          >
                            <td className="whitespace-nowrap px-4 py-3 text-zinc-300">
                              {new Date(item.created_at).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                }
                              )}
                            </td>
                            <td className="max-w-xs truncate px-4 py-3 text-zinc-200">
                              {item.title || ext?.subject || "Untitled"}
                            </td>
                            <td className="px-4 py-3 text-zinc-300">
                              {ext?.issuing_authority || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {risk && <RiskBadge level={risk} />}
                            </td>
                            <td className="px-4 py-3">
                              {item.chain_type && (
                                <ChainBadge type={item.chain_type} />
                              )}
                            </td>
                          </tr>
                          {expandedId === item.id && (
                            <tr>
                              <td
                                colSpan={5}
                                className="bg-[#1a1a1a] px-4 py-4"
                              >
                                {!expandedObligation ? (
                                  <p className="text-sm text-zinc-500">
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
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Prev
                  </button>

                  {historyPageNumbers().map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`e${i}`}
                        className="px-2 text-sm text-zinc-500"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToHistoryPage(p)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          p === historyPage
                            ? "bg-white text-black"
                            : "text-zinc-400 hover:bg-[#2f2f2f] hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                  <button
                    onClick={() => goToHistoryPage(historyPage + 1)}
                    disabled={historyPage === historyTotalPages}
                    className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-800 p-4">
        <p className="text-center text-xs text-zinc-600">
          Powered by your RAG pipeline
        </p>
      </div>
    </div>
  );
}
