"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { LoadingDots } from "@/components/admin/shared";
import LiveDropTimer from "@/components/LiveDropTimer";

const STATIC_FOCUS_CIRCULAR_NUMBER = "MOL/2026/FA-SHIFT-01";

interface CircularDetail {
  id: number;
  source: string;
  title: string;
  date: string;
  link: string | null;
  circularNumber: string;
  pdfLinks: string[];
  department: string;
  content: string;
  aiSummary?: string | null;
  affectedActs?: string[];
  severity?: string | null;
  deadlineDays?: number | null;
}

export default function CircularDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [circular, setCircular] = useState<CircularDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [liveDropId, setLiveDropId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [circRes, liveDropRes] = await Promise.all([
          fetch(`/api/circulars/${id}`),
          fetch(`/api/demo/live-drop-info`),
        ]);
        const data = await circRes.json();
        if (!circRes.ok) {
          setError(data.error || "Failed to load circular.");
          return;
        }
        setCircular(data.circular);
        if (liveDropRes.ok) {
          const ld = await liveDropRes.json();
          if (ld.liveDrop) setLiveDropId(ld.liveDrop.id);
        }
      } catch {
        setError("Could not load circular.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const isFocusCircular = circular?.circularNumber === STATIC_FOCUS_CIRCULAR_NUMBER;

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
          <Link
            href="/obligations"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Obligations
          </Link>
          <Link
            href="/admin"
            className="text-sm text-zinc-400 hover:text-zinc-200"
          >
            Admin
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Link
          href="/circulars"
          className="mb-6 inline-block text-sm text-zinc-400 hover:text-zinc-200"
        >
          &larr; Back to circulars
        </Link>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingDots />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : circular ? (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h1 className="text-lg font-semibold text-white">
                {circular.title || "Untitled"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-400">
                <span className="rounded bg-zinc-700 px-2 py-0.5 text-xs font-semibold uppercase text-white">
                  {circular.source}
                </span>
                {circular.date && <span>{circular.date}</span>}
                {circular.circularNumber && (
                  <span>{circular.circularNumber}</span>
                )}
                {circular.department && <span>{circular.department}</span>}
              </div>

              {circular.link && (
                <div className="mt-4">
                  <a
                    href={circular.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline"
                  >
                    View original source
                  </a>
                </div>
              )}
            </div>

            {circular.aiSummary && (
              <div className="rounded-xl bg-blue-950/40 border border-blue-900/40 p-5">
                <div className="text-xs uppercase tracking-wide text-blue-300 font-semibold mb-2">AI Summary</div>
                <p className="text-sm text-blue-100 leading-relaxed">{circular.aiSummary}</p>
                {(circular.severity || circular.deadlineDays) && (
                  <div className="mt-3 pt-3 border-t border-blue-900/40 flex flex-wrap gap-x-4 gap-y-2 text-xs text-blue-200">
                    {circular.severity && <span>Severity: <span className="font-medium uppercase">{circular.severity}</span></span>}
                    {circular.deadlineDays && <span>Deadline: <span className="font-medium">{circular.deadlineDays} days</span></span>}
                    {circular.affectedActs && circular.affectedActs.length > 0 && <span>Acts: <span className="font-medium">{circular.affectedActs.join(", ")}</span></span>}
                  </div>
                )}
                <div className="mt-3">
                  <Link href={`/circulars/${circular.id}/impact`} className="inline-block text-sm text-blue-300 hover:text-blue-200">
                    View client impact →
                  </Link>
                </div>
              </div>
            )}

            {/* PDF viewer / fallback */}
            <PdfViewer
              pdfLinks={circular.pdfLinks}
              content={circular.content}
            />
          </div>
        ) : null}

        {isFocusCircular && liveDropId !== null && (
          <LiveDropTimer liveDropCircularId={liveDropId} delayMs={60_000} />
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

function PdfViewer({
  pdfLinks,
  content,
}: {
  pdfLinks: string[];
  content: string;
}) {
  const pdfs = Array.isArray(pdfLinks) ? pdfLinks : [];
  const [activeIdx, setActiveIdx] = useState(0);
  const [pdfBlocked, setPdfBlocked] = useState(false);

  const proxyUrl = (url: string) =>
    `/api/circulars/pdf?url=${encodeURIComponent(url)}`;

  // Check if the proxy can serve the PDF; fall back if blocked
  useEffect(() => {
    if (pdfs.length === 0) return;
    setPdfBlocked(false);
    const url = proxyUrl(pdfs[activeIdx]);
    fetch(url, { method: "HEAD" }).then((res) => {
      if (!res.ok || res.headers.get("content-type")?.includes("text/html")) {
        setPdfBlocked(true);
      }
    }).catch(() => setPdfBlocked(true));
  }, [activeIdx, pdfs.length]); // eslint-disable-line react-hooks/exhaustive-deps

  if (pdfs.length === 0) {
    return content ? (
      <div className="rounded-xl bg-[#2f2f2f] p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {content}
        </pre>
      </div>
    ) : (
      <p className="text-sm text-zinc-500">
        No content available for this circular.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* PDF tabs when multiple */}
      {pdfs.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {pdfs.map((url, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                i === activeIdx
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              PDF {i + 1}
            </button>
          ))}
        </div>
      )}

      {pdfBlocked ? (
        /* Fallback when PDF proxy is blocked by CAPTCHA */
        <div className="space-y-4">
          <div className="rounded-xl bg-yellow-900/30 px-4 py-3 text-sm text-yellow-300">
            The source website blocked the embedded PDF viewer. You can open the
            PDF directly in your browser instead.
          </div>
          <div className="flex gap-3">
            <a
              href={pdfs[activeIdx]}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
            >
              Open PDF in browser
            </a>
          </div>
          {content && (
            <div className="rounded-xl bg-[#2f2f2f] p-5">
              <h3 className="mb-3 text-sm font-semibold text-zinc-300">
                Scraped text content
              </h3>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
                {content}
              </pre>
            </div>
          )}
        </div>
      ) : (
        /* Normal PDF embed */
        <>
          <div className="overflow-hidden rounded-xl bg-[#2f2f2f]">
            <iframe
              key={pdfs[activeIdx]}
              src={proxyUrl(pdfs[activeIdx])}
              className="h-[100vh] w-full"
              title={`PDF ${activeIdx + 1}`}
            />
          </div>

          <div className="flex justify-end">
            <a
              href={pdfs[activeIdx]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline"
            >
              Open PDF in new tab
            </a>
          </div>
        </>
      )}
    </div>
  );
}
