"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logging";

export default function AnalyzeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app.analyze.error", error);
  }, [error]);

  return (
    <div className="app-error-shell">
      <div className="app-error-card">
        <h2>Analysis error</h2>
        <p>
          The analysis engine returned an error. You can retry or go back to
          start a new analysis.
        </p>
        <div className="app-error-actions">
          <button
            onClick={reset}
            className="btn btn-primary"
            type="button"
          >
            Try again
          </button>
          <Link href="/analyze" className="btn btn-outline">
            New analysis
          </Link>
        </div>
      </div>
    </div>
  );
}
