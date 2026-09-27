"use client";

import { useTransition, useState } from "react";

type Props = {
  itemId: string;
  initialStatus: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
  overdue: "Overdue",
  dismissed: "Dismissed",
};

export default function InteractiveStatusPill({ itemId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggle() {
    if (isPending) return;
    setError(null);
    const prev = status;
    const next = prev === "done" ? "pending" : "done";
    startTransition(async () => {
      try {
        const res = await fetch(`/api/compliance/${itemId}/toggle`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? `Request failed ${res.status}`);
        }
        const data = await res.json().catch(() => ({}));
        setStatus(data.status ?? next);
      } catch (e) {
        setStatus(prev);
        setError(e instanceof Error ? e.message : "Toggle failed");
      }
    });
  }

  const label = STATUS_LABEL[status] ?? status.replace("_", " ");
  const className = `status-pill status-${status}${isPending ? " opacity-60 cursor-wait" : ""}`;

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={className}
        title="Click to toggle between Done / Pending"
      >
        {label}
      </button>
      {error && (
        <span style={{ fontSize: 10, color: "var(--danger)" }}>{error}</span>
      )}
    </span>
  );
}
