"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  liveDropCircularId: number;
  delayMs?: number;
};

const PAUSE_MS = 30_000;

export default function LiveDropTimer({ liveDropCircularId, delayMs = 60_000 }: Props) {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef<number>(delayMs);
  const timeoutRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    function fire() {
      fetch(`/api/demo/release/${liveDropCircularId}`, { method: "POST" }).catch(() => {});
    }

    function arm(ms: number) {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
      startedAtRef.current = Date.now();
      timeoutRef.current = window.setTimeout(() => {
        fire();
        timeoutRef.current = null;
      }, ms);
    }

    arm(delayMs);

    function onKey(e: KeyboardEvent) {
      if (e.metaKey && e.shiftKey && (e.key === "T" || e.key === "t")) {
        e.preventDefault();
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        fire();
      }
      if (e.metaKey && e.shiftKey && (e.key === "P" || e.key === "p")) {
        e.preventDefault();
        const elapsed = Date.now() - startedAtRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed) + PAUSE_MS;
        arm(remainingRef.current);
        setPaused(true);
        setTimeout(() => setPaused(false), 1500);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [liveDropCircularId, delayMs]);

  return (
    <>
      {paused && (
        <div className="fixed bottom-6 right-6 bg-slate-800 text-white text-xs px-3 py-2 rounded shadow">
          +30s extended
        </div>
      )}
    </>
  );
}
