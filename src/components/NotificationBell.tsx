"use client";

import { useEffect, useState, useRef } from "react";
import { Bell } from "lucide-react";

type Notification = {
  id: number;
  title: string;
  severity: string | null;
  releasedAt: string;
  affectedActs: string[];
  affectedCount: number;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestToast, setLatestToast] = useState<Notification | null>(null);
  const seenIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    let active = true;

    async function poll() {
      try {
        const r = await fetch("/api/notifications/recent");
        if (!r.ok) return;
        const data = await r.json();
        const next: Notification[] = data.notifications;
        if (!active) return;

        if (!initialized.current) {
          next.forEach((n) => seenIds.current.add(n.id));
          initialized.current = true;
        } else {
          const fresh = next.find((n) => !seenIds.current.has(n.id));
          if (fresh) {
            seenIds.current.add(fresh.id);
            setLatestToast(fresh);
          }
        }
        setNotifications(next);
      } catch {
        // ignore polling errors
      }
    }

    poll();
    const i = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(i);
    };
  }, []);

  return (
    <>
      <button
        className="relative p-2 hover:bg-slate-100 rounded"
        title="Notifications"
        onClick={() => setLatestToast(null)}
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {latestToast && (
        <div
          role="alert"
          className="fixed top-6 right-6 z-50 bg-white border border-slate-300 shadow-lg rounded-lg p-4 max-w-sm cursor-pointer"
          onClick={() => {
            const id = latestToast.id;
            setLatestToast(null);
            window.location.href = `/circulars/${id}/impact`;
          }}
        >
          <div className="flex items-start gap-2">
            <Bell className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-xs font-medium text-amber-700 uppercase tracking-wide">New circular detected</div>
              <div className="text-sm font-semibold mt-1">{latestToast.title}</div>
              <div className="text-xs text-slate-600 mt-2">
                {latestToast.affectedCount} of your clients affected
              </div>
              <div className="text-xs text-blue-600 mt-2">Click to view impact →</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
