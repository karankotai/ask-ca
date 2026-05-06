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
        // ignore
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
      <button className="bell-btn" title="Notifications" onClick={() => setLatestToast(null)}>
        <Bell size={18} />
        {notifications.length > 0 && <span className="bell-count">{notifications.length}</span>}
      </button>

      {latestToast && (
        <div
          role="alert"
          className="toast"
          onClick={() => {
            const id = latestToast.id;
            setLatestToast(null);
            window.location.href = `/circulars/${id}/impact`;
          }}
        >
          <div className="toast-row">
            <div className="toast-icon"><Bell size={18} /></div>
            <div style={{ flex: 1 }}>
              <div className="eyebrow">New circular detected</div>
              <div className="title">{latestToast.title}</div>
              <div className="meta">{latestToast.affectedCount} of your clients affected</div>
              <div className="cta">Click to view impact →</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
