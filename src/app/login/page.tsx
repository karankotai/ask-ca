import type { Metadata } from "next";
import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in — RegMitra",
  description: "Sign in to your RegMitra workspace.",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-zinc-500 p-8">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
