"use client";

import { useEffect } from "react";
import Link from "next/link";
import { logError } from "@/lib/logging";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logError("app.globalError", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6 text-center p-8 rounded-2xl border border-zinc-200 bg-white/60 shadow-sm">
        <div className="mx-auto h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500 text-xl font-bold">
          !
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-zinc-900">
            Something went wrong
          </h2>
          <p className="text-sm text-zinc-500">
            An unexpected error occurred. Try again, or head back to the
            dashboard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 transition"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
