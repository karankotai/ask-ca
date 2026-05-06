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
    <div className="screen">
      <div className="page-row">
        <div>
          <div className="page-title">Compliance calendar</div>
          <div className="page-subtitle">All clients · sorted by due date</div>
        </div>
      </div>
      <CalendarTable items={mapped} totalCount={total} />
    </div>
  );
}
