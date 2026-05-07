import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import CalendarTable from "./CalendarTable";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type EventStatus = "completed" | "upcoming" | "overdue";

function classify(status: string, dueDate: Date, now: Date): EventStatus {
  if (status === "done") return "completed";
  if (dueDate < now) return "overdue";
  return "upcoming";
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage({ searchParams }: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const { month: monthParam, view: viewParam } = await searchParams;
  const view = viewParam === "list" ? "list" : "month";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const cursor = monthParam
    ? (() => {
        const [y, m] = monthParam.split("-").map(Number);
        return new Date(y, m - 1, 1);
      })()
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const items = await prisma.complianceItem.findMany({
    include: { client: true },
    orderBy: { dueDate: "asc" },
  });

  const inMonth = items.filter(
    (i) => i.dueDate >= monthStart && i.dueDate <= monthEnd,
  );

  // Group events by yyyy-mm-dd to render dots
  const byDay = new Map<string, EventStatus[]>();
  for (const it of inMonth) {
    const key = ymd(it.dueDate);
    const list = byDay.get(key) ?? [];
    list.push(classify(it.status, it.dueDate, now));
    byDay.set(key, list);
  }

  // Build the 6-week grid (Mon-first)
  // Find the Monday on or before the 1st of the month
  const firstWeekday = monthStart.getDay(); // 0=Sun, 1=Mon, ...
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;
  const gridStart = new Date(year, month, 1 - offset);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i));
  }
  // Trim to last full week containing month
  const lastInMonthIndex = cells.findIndex((d) => d.getMonth() !== month && d > monthEnd);
  let displayCells = cells;
  if (lastInMonthIndex >= 0) {
    const lastWeek = Math.ceil(lastInMonthIndex / 7);
    displayCells = cells.slice(0, lastWeek * 7);
  }

  const prevMonth = new Date(year, month - 1, 1);
  const nextMonth = new Date(year, month + 1, 1);
  const prevQs = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;
  const nextQs = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`;

  // For the right list — sort by due date, show all items in month
  const sideItems = inMonth.map((it) => ({
    id: it.id,
    title: it.actionRequired,
    client: it.client.name,
    dueDate: it.dueDate,
    status: classify(it.status, it.dueDate, now),
    actName: it.actName,
  }));

  // For list view fallback
  const tableItems = items.map((i) => ({
    id: i.id,
    clientName: i.client.name,
    actName: i.actName,
    actionRequired: i.actionRequired,
    dueDate: i.dueDate.toISOString(),
    status: i.status,
    severity: i.severity,
  }));

  if (view === "list") {
    return (
      <div className="screen">
        <div className="page-row">
          <div>
            <div className="page-title">Compliance calendar</div>
            <div className="page-subtitle">All clients · sorted by due date</div>
          </div>
          <div className="cal-view-toggle">
            <Link href="/calendar" className="">Month</Link>
            <Link href="/calendar?view=list" className="active">List</Link>
          </div>
        </div>
        <CalendarTable items={tableItems} totalCount={items.length} />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="page-row">
        <div>
          <div className="page-title">Compliance calendar</div>
          <div className="page-subtitle">All clients · {MONTH_NAMES[month]} {year}</div>
        </div>
        <div className="cal-view-toggle">
          <Link href={`/calendar?month=${year}-${String(month + 1).padStart(2, "0")}`} className="active">Month</Link>
          <Link href="/calendar?view=list" className="">List</Link>
        </div>
      </div>

      <div className="cal-layout">
        <div className="cal-month">
          <div className="cal-month-header">
            <div className="cal-month-title">{MONTH_NAMES[month]} {year}</div>
            <div className="cal-month-nav">
              <Link href={`/calendar?month=${prevQs}`} aria-label="Previous month"><ChevronLeft size={18} /></Link>
              <Link href={`/calendar?month=${nextQs}`} aria-label="Next month"><ChevronRight size={18} /></Link>
            </div>
          </div>

          <div className="cal-weekday-row">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
          </div>

          <div className="cal-month-grid">
            {displayCells.map((date, i) => {
              const isOutside = date.getMonth() !== month;
              const isToday = ymd(date) === ymd(today);
              const dayEvents = byDay.get(ymd(date)) ?? [];
              const uniqueStatuses = Array.from(new Set(dayEvents));

              return (
                <div
                  key={i}
                  className={`cal-day-cell ${isOutside ? "outside" : ""} ${isToday ? "today" : ""} ${dayEvents.length ? "has-events" : ""}`}
                >
                  <span>{date.getDate()}</span>
                  {!isToday && uniqueStatuses.length > 0 && (
                    <div className="cal-dots">
                      {uniqueStatuses.map((s, j) => (
                        <span key={j} className={`cal-dot ${s}`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="cal-legend">
            <div className="cal-legend-item"><span className="cal-dot completed" /> Completed</div>
            <div className="cal-legend-item"><span className="cal-dot upcoming" /> Upcoming</div>
            <div className="cal-legend-item"><span className="cal-dot overdue" /> Overdue</div>
          </div>
        </div>

        <div className="cal-side">
          <div className="cal-side-title">Across All Clients</div>
          {sideItems.length === 0 && (
            <div className="empty-state" style={{ padding: "20px 0" }}>No items in this month.</div>
          )}
          {sideItems.map((it) => {
            const Icon = it.status === "overdue" ? AlertTriangle : it.status === "upcoming" ? Clock : CheckCircle2;
            const dateLabel = `${MONTH_NAMES[it.dueDate.getMonth()].slice(0, 3)} ${it.dueDate.getDate()}`;
            return (
              <Link key={it.id} href="/calendar?view=list" className="cal-event-card">
                <div className="cal-event-text">
                  <div className="cal-event-title">{it.title}</div>
                  <div className="cal-event-client">{it.client}</div>
                </div>
                <div className="cal-event-side">
                  <div className={`cal-event-icon ${it.status}`}>
                    <Icon size={16} />
                  </div>
                  <div className="cal-event-date">{dateLabel}</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
