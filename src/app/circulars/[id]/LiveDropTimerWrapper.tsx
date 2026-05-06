"use client";

import LiveDropTimer from "@/components/LiveDropTimer";

export default function LiveDropTimerWrapper({ liveDropId }: { liveDropId: number }) {
  return <LiveDropTimer liveDropCircularId={liveDropId} delayMs={60_000} />;
}
