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
    <div className="min-h-screen flex items-center justify-center bg-[#212121] text-white p-8">
      <div className="max-w-md w-full space-y-6 text-center p-8 rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <h2 className="text-xl font-semibold">Admin tool error</h2>
        <p className="text-sm text-zinc-400">
          The admin panel hit an error. Details are logged server-side.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-zinc-100 transition"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
