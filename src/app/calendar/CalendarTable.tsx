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

export default function CalendarTable({ items: initialItems, totalCount }: Props) {
  const [items, setItems] = useState(initialItems);
  const [filterClient, setFilterClient] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filtered = items.filter((i) => {
    if (filterClient !== "all" && i.clientName !== filterClient) return false;
    if (filterStatus !== "all" && i.status !== filterStatus) return false;
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
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <div className="progress">
          <strong style={{ color: "var(--text-dark)" }}>{doneCount}</strong> of {totalCount} items complete this month
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
          {filtered.map((i) => (
            <tr key={i.id} className={i.severity === "critical" ? "critical" : ""}>
              <td className="client">{i.clientName}</td>
              <td>{i.actName}</td>
              <td>{i.actionRequired}</td>
              <td style={{ color: "var(--text-light)", whiteSpace: "nowrap" }}>
                {new Date(i.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </td>
              <td style={{ textAlign: "right" }}>
                <button onClick={() => toggle(i.id)} className={`status-pill status-${i.status}`}>
                  {i.status === "done" ? <><Check size={11} /> done</> : i.status.replace("_", " ")}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
