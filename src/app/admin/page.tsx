"use client";

import { useState } from "react";
import Link from "next/link";
import ScrapingTab from "@/components/admin/ScrapingTab";
import IndexingTab from "@/components/admin/IndexingTab";
import EvaluateTab from "@/components/admin/EvaluateTab";
import ReportsTab from "@/components/admin/ReportsTab";

type Tab = "scraping" | "indexing" | "evaluate" | "reports";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("scraping");

  const tabs: { key: Tab; label: string }[] = [
    // { key: "scraping", label: "Scraping" },
    // { key: "indexing", label: "Indexing" },
    { key: "evaluate", label: "Evaluate" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#212121] text-white">
      {/* Nav */}
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
          <span className="text-sm font-medium text-white">Admin</span>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage scraping, indexing, evaluations, and view reports.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {/* {tab === "scraping" && <ScrapingTab />}
        {tab === "indexing" && <IndexingTab />} */}
        {tab === "evaluate" && <EvaluateTab />}
        {tab === "reports" && <ReportsTab />}
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
