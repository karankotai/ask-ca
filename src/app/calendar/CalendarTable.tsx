"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Item = {
  id: string;
  clientName: string;
  actName: string;
  actionRequired: string;
  dueDate: string;
  status: string;
  severity: string;
};

type Props = {
  items: Item[];
  totalCount: number;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
  overdue: "Overdue",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? capitalizeFirst(status.replace("_", " "));
}

function capitalizeFirst(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function isOverdueDueDate(dueDate: string, status: string): boolean {
  if (status === "done") return false;
  const d = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export default function CalendarTable({ items: initialItems, totalCount }: Props) {
  const [items, setItems] = useState(initialItems);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = items.filter((i) => {
    if (filterClient !== "all" && i.clientName !== filterClient) return false;
    const iStatus = isOverdueDueDate(i.dueDate, i.status) ? "overdue" : i.status;
    if (filterStatus !== "all" && iStatus !== filterStatus) return false;
    return true;
  });

  const doneCount = items.filter((i) => i.status === "done").length;
  const clients = Array.from(new Set(items.map((i) => i.clientName)));

  async function toggle(id: string) {
    const r = await fetch(`/api/compliance/${id}/toggle`, { method: "POST" });
    if (r.ok) {
      const data = await r.json();
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: data.status } : it)));
    }
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="filters" style={{ padding: "16px 20px", marginBottom: 0, borderBottom: "1px solid var(--border)" }}>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
          <option value="all">All clients</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <div className="progress">
          <strong style={{ color: "var(--text-dark)" }}>{doneCount}</strong> of {totalCount} items complete
        </div>
      </div>

      <table className="list-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Act</th>
            <th>Action required</th>
            <th>Due</th>
            <th style={{ textAlign: "right" }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => {
            const derivedStatus = isOverdueDueDate(i.dueDate, i.status) ? "overdue" : i.status;
            return (
              <tr key={i.id} className={i.severity === "critical" ? "critical" : ""}>
                <td className="client">{i.clientName}</td>
                <td>{i.actName}</td>
                <td>{i.actionRequired}</td>
                <td style={{ color: "var(--text-light)", whiteSpace: "nowrap" }}>
                  {new Date(i.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button onClick={() => toggle(i.id)} className={`status-pill status-${derivedStatus}`}>
                    {derivedStatus === "done" ? <><Check size={11} />{statusLabel(derivedStatus)}</> : statusLabel(derivedStatus)}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
