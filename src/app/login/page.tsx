import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import LoginForm from "@/components/LoginForm";
import { getSessionSafe } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Sign in — RegMitra",
  description: "Sign in to your RegMitra workspace.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSessionSafe();
  if (session?.user) {
    const params = searchParams ? await searchParams : undefined;
    redirect(params?.callbackUrl || "/");
  }

  return (
    <Suspense fallback={<div className="login-shell"><div className="empty-state" style={{ color: "#a1a1aa" }}>Loading…</div></div>}>
      <LoginForm />
    </Suspense>
  );
}
