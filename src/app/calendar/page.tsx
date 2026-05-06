import { prisma } from "@/lib/prisma";
import CalendarTable from "./CalendarTable";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const items = await prisma.complianceItem.findMany({
    include: { client: true },
    orderBy: { dueDate: "asc" },
  });

  const total = items.length;
  const mapped = items.map((i) => ({
    id: i.id,
    clientName: i.client.name,
    actName: i.actName,
    actionRequired: i.actionRequired,
    dueDate: i.dueDate.toISOString(),
    status: i.status,
    severity: i.severity,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-semibold mb-6">Compliance calendar</h1>
      <CalendarTable items={mapped} totalCount={total} />
    </div>
  );
}
