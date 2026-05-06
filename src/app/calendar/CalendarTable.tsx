"use client";

import { useState } from "react";

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
    <>
      <div className="flex gap-3 mb-4">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
        >
          <option value="all">All clients</option>
          {clients.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded px-2 py-1 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
          <option value="overdue">Overdue</option>
        </select>
        <div className="ml-auto text-sm text-slate-600 self-center">
          {doneCount} of {totalCount} items complete this month
        </div>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-3 py-2">Client</th>
            <th className="px-3 py-2">Act</th>
            <th className="px-3 py-2">Action required</th>
            <th className="px-3 py-2">Due</th>
            <th className="px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((i) => (
            <tr key={i.id} className={`border-t border-slate-100 ${i.severity === "critical" ? "bg-red-50" : ""}`}>
              <td className="px-3 py-2 font-medium">{i.clientName}</td>
              <td className="px-3 py-2 text-slate-600">{i.actName}</td>
              <td className="px-3 py-2">{i.actionRequired}</td>
              <td className="px-3 py-2 text-slate-500">{new Date(i.dueDate).toLocaleDateString("en-IN")}</td>
              <td className="px-3 py-2">
                <button
                  onClick={() => toggle(i.id)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    i.status === "done" ? "bg-emerald-100 text-emerald-700" :
                    i.status === "overdue" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {i.status === "done" ? "✓ done" : i.status}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
