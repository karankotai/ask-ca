import { prisma } from "@/lib/prisma";
import ConcentrationChart from "@/components/ConcentrationChart";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      counterparties: { orderBy: { concentrationPct: "desc" } },
      transactions: {
        include: { counterparty: true },
        orderBy: { date: "desc" },
        take: 8,
      },
      complianceItems: {
        orderBy: { dueDate: "asc" },
      },
    },
  });

  if (!client) notFound();

  const totalTxnCount = await prisma.transaction.count({ where: { clientId: client.id } });

  const chartData = client.counterparties.map((c) => ({
    name: c.name,
    value: c.concentrationPct,
    isFlagged: c.concentrationPct >= 40,
  }));

  const postureClass =
    client.postureBadge === "HIGH_RISK" ? "bg-red-100 text-red-800 border-red-300" :
    client.postureBadge === "MEDIUM_RISK" ? "bg-amber-100 text-amber-800 border-amber-300" :
    "bg-emerald-100 text-emerald-800 border-emerald-300";

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold">{client.name}</h1>
          <p className="text-slate-600 text-sm mt-1">
            {client.sector} · ₹{client.turnoverCr} cr turnover · {client.city}
          </p>
          <p className="text-slate-500 text-xs mt-1">{client.ownership}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${postureClass}`}>
          {client.postureBadge.replace("_", " ")}
        </span>
      </div>

      <h2 className="text-lg font-semibold mt-8 mb-3">Counterparty concentration</h2>
      <ConcentrationChart data={chartData} threshold={40} />

      <h2 className="text-lg font-semibold mt-8 mb-3">Recent transactions ({client.transactions.length} of {totalTxnCount})</h2>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-3 py-2">Invoice</th>
            <th className="px-3 py-2">Counterparty</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Amount</th>
            <th className="px-3 py-2">Date</th>
          </tr>
        </thead>
        <tbody>
          {client.transactions.map((t) => (
            <tr key={t.id} className="border-t border-slate-100">
              <td className="px-3 py-2 font-mono text-xs">{t.invoiceNumber}</td>
              <td className="px-3 py-2">{t.counterparty.name}</td>
              <td className="px-3 py-2 capitalize">{t.type}</td>
              <td className="px-3 py-2 text-right">₹{(t.amount / 1e7).toFixed(2)} cr</td>
              <td className="px-3 py-2 text-slate-500">{t.date.toLocaleDateString("en-IN")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mt-8 mb-3">Open compliance items</h2>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {client.complianceItems.map((item) => (
          <div key={item.id} className="px-4 py-3 border-b border-slate-100 last:border-b-0 flex items-center justify-between">
            <div>
              <div className="font-medium">{item.actionRequired}</div>
              <div className="text-xs text-slate-500 mt-0.5">{item.actName} · due {item.dueDate.toLocaleDateString("en-IN")}</div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              item.status === "done" ? "bg-emerald-100 text-emerald-700" :
              item.status === "overdue" ? "bg-red-100 text-red-700" :
              "bg-slate-100 text-slate-700"
            }`}>{item.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
