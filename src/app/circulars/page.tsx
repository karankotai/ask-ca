"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LoadingDots } from "@/components/admin/shared";

const SOURCES = [
  { value: "", label: "All Sources" },
  { value: "RBI", label: "RBI" },
  { value: "SEBI", label: "SEBI" },
  { value: "MCA", label: "MCA" },
  { value: "IRDAI", label: "IRDAI" },
  { value: "egazette", label: "E-Gazette" },
  { value: "other", label: "Custom" },
];

interface Circular {
  id: number;
  source: string;
  title: string;
  date: string;
  link: string | null;
  circularNumber: string;
  pdfLinks: string[];
  department: string;
}

const SOURCE_COLORS: Record<string, string> = {
  rbi: "bg-emerald-600",
  sebi: "bg-orange-600",
  mca: "bg-blue-600",
  irdai: "bg-purple-600",
  egazette: "bg-yellow-600",
  other: "bg-pink-600",
};

function sourceColorClass(source: string): string {
  const key = source.toLowerCase().split(" ")[0];
  return SOURCE_COLORS[key] || "bg-zinc-600";
}

export default function CircularsPage() {
  const [circulars, setCirculars] = useState<Circular[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [source, setSource] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const fetchCirculars = useCallback(
    async (p: number) => {
      const params = new URLSearchParams();
      if (source) params.set("source", source);
      if (search) params.set("search", search);
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      params.set("page", String(p));

      const res = await fetch(`/api/circulars?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch circulars");
      return data as {
        circulars: Circular[];
        page: number;
        totalPages: number;
        total: number;
      };
    },
    [source, search, from, to]
  );

  // Fetch when filters or page change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchCirculars(page)
      .then((data) => {
        if (cancelled) return;
        setCirculars(data.circulars);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchCirculars, page]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [source, search, from, to]);

  const handleSearchChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(value), 300);
  };

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Build page numbers to show (max 7 buttons with ellipsis)
  const pageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (page > 3) pages.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      <nav className="border-b border-zinc-800 px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-6">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Chat
          </Link>
          <span className="text-sm font-medium text-white">Circulars</span>
          <Link
            href="/evaluate"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Evaluate
          </Link>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Filter bar */}
      <div className="sticky top-0 z-10 border-b border-zinc-800 bg-[#212121] px-4 py-3">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-xl bg-[#2f2f2f] px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="From"
            className="rounded-xl bg-[#2f2f2f] px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
          />
          <input
            type="month"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="To"
            className="rounded-xl bg-[#2f2f2f] px-4 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-zinc-600"
          />

          <input
            type="text"
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search title or circular number..."
            className="min-w-[220px] flex-1 rounded-xl bg-[#2f2f2f] px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingDots />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : circulars.length === 0 ? (
          <p className="py-20 text-center text-zinc-500">
            No circulars found.
          </p>
        ) : (
          <>
            <p className="mb-4 text-xs text-zinc-500">
              {total.toLocaleString()} circular{total !== 1 ? "s" : ""} found
            </p>

            <div className="grid gap-3">
              {circulars.map((c) => (
                <Link
                  key={c.id}
                  href={`/circulars/${c.id}`}
                  className="group rounded-xl bg-[#2f2f2f] p-4 transition-colors hover:bg-[#383838]"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-semibold uppercase text-white ${sourceColorClass(c.source)}`}
                    >
                      {c.source}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-zinc-100 group-hover:text-white">
                        {c.title || "Untitled"}
                      </h3>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                        {c.date && <span>{c.date}</span>}
                        {c.circularNumber && <span>{c.circularNumber}</span>}
                        {c.department && <span>{c.department}</span>}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Prev
                </button>

                {pageNumbers().map((p, i) =>
                  p === "..." ? (
                    <span key={`e${i}`} className="px-2 text-sm text-zinc-500">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        p === page
                          ? "bg-white text-black"
                          : "text-zinc-400 hover:bg-[#2f2f2f] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="rounded-lg px-3 py-2 text-sm text-zinc-400 hover:bg-[#2f2f2f] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="border-t border-zinc-800 p-4">
        <p className="text-center text-xs text-zinc-600">
          Powered by your RAG pipeline
        </p>
      </div>
    </div>
  );
}
