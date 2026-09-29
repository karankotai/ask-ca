"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, CheckCheck, X } from "lucide-react";
import { severityLabel, severityPriorityClass } from "@/lib/utils";

type Notification = {
  id: number;
  title: string;
  severity: string | null;
  releasedAt: string;
  affectedActs: string[];
  affectedCount: number;
};

const TOAST_AUTO_DISMISS_MS = 8000;
const MAX_DROPDOWN = 8;

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestToast, setLatestToast] = useState<Notification | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [readOptimistic, setReadOptimistic] = useState(false);

  const seenIds = useRef<Set<number>>(new Set());
  const initialized = useRef(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Poll for new notifications
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
            setReadOptimistic(false);
            scheduleToastDismiss();
          }
        }
        setNotifications(next);
      } catch (e) {
        // Poll failures are transient; no need to spam console
      }
    }

    poll();
    const i = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(i);
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Outside-click / Escape to close dropdown
  useEffect(() => {
    if (!dropdownOpen) return;

    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && wrapperRef.current.contains(e.target)) return;
      setDropdownOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [dropdownOpen]);

  function scheduleToastDismiss() {
    if (toastTimeoutRef.current !== null) window.clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = window.setTimeout(() => {
      setLatestToast(null);
      toastTimeoutRef.current = null;
    }, TOAST_AUTO_DISMISS_MS);
  }

  function handleBellClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen((v) => !v);
    setLatestToast(null);
  }

  function handleMarkAllRead() {
    setReadOptimistic(true);
    setNotifications([]);
  }

  function openNotification(n: Notification) {
    setLatestToast(null);
    setDropdownOpen(false);
    window.location.href = `/circulars/${n.id}/impact`;
  }

  const displayCount = readOptimistic ? 0 : notifications.length;

  return (
    <>
      <div ref={wrapperRef} style={{ position: "relative" }}>
        <button
          className="bell-btn"
          title="Notifications"
          onClick={handleBellClick}
          aria-label={`Notifications${displayCount > 0 ? `, ${displayCount} unread` : ""}`}
          aria-haspopup="menu"
          aria-expanded={dropdownOpen}
        >
          <Bell size={18} />
          {displayCount > 0 && <span className="bell-count">{displayCount > 99 ? "99+" : displayCount}</span>}
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              width: 380,
              maxHeight: 480,
              overflow: "hidden",
              background: "var(--bg-white)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "var(--shadow-xl)",
              zIndex: 50,
              display: "flex",
              flexDirection: "column",
              animation: "fadeUp 0.15s ease",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid var(--border-light)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-dark)" }}>
                Notifications
              </div>
              {displayCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: "var(--accent)",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontFamily: "inherit",
                  }}
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setDropdownOpen(false)}
                aria-label="Close notifications"
                style={{
                  marginLeft: 8,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-light)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={14} />
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {notifications.length === 0 && (
                <div className="empty-state" style={{ padding: "48px 20px" }}>
                  No recent notifications.
                </div>
              )}
              {notifications.slice(0, MAX_DROPDOWN).map((n) => {
                const d = new Date(n.releasedAt);
                const dateLabel = Number.isNaN(d.getTime())
                  ? ""
                  : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                const sev = n.severity ?? "low";
                return (
                  <button
                    key={n.id}
                    role="menuitem"
                    onClick={() => openNotification(n)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      background: "transparent",
                      border: "none",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border-light)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "background 0.12s",
                      display: "block",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-main)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <span className={severityPriorityClass(sev)} style={{ marginTop: 2, flexShrink: 0 }}>
                        {severityLabel(sev)}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--text-dark)",
                            lineHeight: 1.35,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}
                        >
                          {n.title}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 10, color: "var(--text-light)" }}>
                            {dateLabel}
                          </span>
                          {n.affectedCount > 0 && (
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--accent)",
                                fontWeight: 500,
                              }}
                            >
                              {n.affectedCount} client{n.affectedCount !== 1 ? "s" : ""} affected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {notifications.length > MAX_DROPDOWN && (
              <div
                style={{
                  padding: "10px 16px",
                  borderTop: "1px solid var(--border-light)",
                  fontSize: 11,
                  color: "var(--text-light)",
                  textAlign: "center",
                }}
              >
                {notifications.length - MAX_DROPDOWN} older notifications not shown
              </div>
            )}
          </div>
        )}
      </div>

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
