import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clients = await prisma.client.findMany({
    include: {
      complianceItems: {
        where: { status: { in: ["pending", "in_progress", "overdue"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  });

  const flaggedClients = clients.filter((c) =>
    c.complianceItems.some((i) => i.severity === "critical" || i.severity === "high"),
  );

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCirculars = await prisma.scrapedDocument.count({
    where: {
      crawler: "demo",
      releasedAt: { not: null, gte: sevenDaysAgo, lte: new Date() },
    },
  });

  const impacts = await prisma.impactAnalysis.findMany();
  const totalExposureRupees = impacts.reduce((sum, i) => {
    const payload = i.payload as { totalAmount?: number };
    return sum + (payload.totalAmount ?? 0);
  }, 0);
  const totalExposureCr = (totalExposureRupees / 1e7).toFixed(0);

  const allOpenItems = clients
    .flatMap((c) => c.complianceItems.map((i) => ({ client: c, item: i })))
    .sort((a, b) => {
      const sevOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (sevOrder[a.item.severity] ?? 4) - (sevOrder[b.item.severity] ?? 4);
    })
    .slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-1">Good morning.</h1>
      <p className="text-slate-600 mb-6">Here&apos;s what changed since Friday.</p>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-red-700">{flaggedClients.length}</div>
          <div className="text-sm text-red-700 mt-1">clients flagged</div>
        </div>
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
          <div className="text-3xl font-bold text-amber-700">{recentCirculars}</div>
          <div className="text-sm text-amber-700 mt-1">new circulars since Friday</div>
        </div>
        <div className="border border-slate-200 bg-slate-50 rounded-lg p-4">
          <div className="text-3xl font-bold">₹{totalExposureCr} cr</div>
          <div className="text-sm text-slate-600 mt-1">total exposure across affected transactions</div>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Needs attention today</h2>
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        {allOpenItems.map(({ client, item }) => (
          <Link
            key={item.id}
            href={`/clients/${client.id}`}
            className="flex items-center justify-between px-4 py-3 border-b border-slate-100 hover:bg-slate-50 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-2 h-2 rounded-full ${
                  item.severity === "critical" ? "bg-red-500" :
                  item.severity === "high" ? "bg-orange-500" :
                  item.severity === "medium" ? "bg-amber-400" : "bg-slate-300"
                }`}
              />
              <span className="font-medium">{client.name}</span>
              <span className="text-sm text-slate-600">— {item.actionRequired}</span>
            </div>
            <div className="text-sm text-slate-500">
              {item.actName} · due {item.dueDate.toLocaleDateString("en-IN")}
            </div>
          </Link>
        ))}
        {allOpenItems.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-500">No open items.</div>
        )}
      </div>
    </div>
  );
}
