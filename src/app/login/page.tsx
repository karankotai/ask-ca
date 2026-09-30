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
    <Suspense fallback={<div className="login-shell"><div className="empty-state" style={{ color: "#a1a1aa" }}>Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
