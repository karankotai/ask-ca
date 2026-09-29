"use client";

import { useState } from "react";
import EvaluateTab from "@/components/admin/EvaluateTab";
import ReportsTab from "@/components/admin/ReportsTab";
import UploadTab from "@/components/admin/UploadTab";
import CrawlTab from "@/components/admin/CrawlTab";
import IndexingTab from "@/components/admin/IndexingTab";

type Tab = "upload" | "crawl" | "index" | "evaluate" | "reports";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("upload");

  const tabs: { key: Tab; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "crawl", label: "Crawl" },
    { key: "index", label: "Index" },
    { key: "evaluate", label: "Evaluate" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="screen" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Admin Dashboard</div>
          <div className="page-subtitle">
            Upload documents, run crawlers, index the corpus, evaluate the RAG, and review reports.
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={"admin-tab " + (tab === t.key ? "selected" : "")}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="admin-page">
        {tab === "upload" && <UploadTab />}
        {tab === "crawl" && <CrawlTab />}
        {tab === "index" && <IndexingTab />}
        {tab === "evaluate" && <EvaluateTab />}
        {tab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}
