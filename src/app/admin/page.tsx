"use client";

import { useState } from "react";
import EvaluateTab from "@/components/admin/EvaluateTab";
import ReportsTab from "@/components/admin/ReportsTab";
import UploadTab from "@/components/admin/UploadTab";

type Tab = "upload" | "evaluate" | "reports";

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("upload");

  const tabs: { key: Tab; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "evaluate", label: "Evaluate" },
    { key: "reports", label: "Reports" },
  ];

  return (
    <div className="screen" style={{ maxWidth: 1080, margin: "0 auto" }}>
      <div className="page-row">
        <div>
          <div className="page-title">Admin Dashboard</div>
          <div className="page-subtitle">
            Manage uploads, evaluations, and view reports.
          </div>
        </div>
      </div>

      <div className="channel-toggle" style={{ marginBottom: 24 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={tab === t.key ? "active" : ""}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "upload" && <UploadTab />}
      {tab === "evaluate" && <EvaluateTab />}
      {tab === "reports" && <ReportsTab />}
    </div>
  );
}
