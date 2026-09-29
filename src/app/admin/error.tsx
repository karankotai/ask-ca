"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logging";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app.admin.error", error);
  }, [error]);

  return (
    <div className="app-error-shell">
      <div className="app-error-card">
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>
          Admin tool error
        </h2>
        <p style={{ color: "var(--text-mid)", fontSize: 14, margin: "6px 0 0" }}>
          The admin panel hit an error. Details are logged server-side.
        </p>
        <div className="app-error-actions">
          <button type="button" onClick={reset} className="btn btn-primary">
            Try again
          </button>
          <Link href="/admin" className="btn btn-outline">
            Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
