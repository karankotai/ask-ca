import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import SignUpForm from "@/components/SignUpForm";
import { prisma } from "@/lib/prisma";
import { getSessionSafe } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Create account — RegMitra",
  description: "Register a RegMitra account.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const session = await getSessionSafe();
  if (session?.user) redirect("/");

  let usersExist = false;
  try {
    usersExist = (await prisma.user.count()) > 0;
  } catch {
    usersExist = false;
  }

  if (usersExist) {
    return (
      <div className="login-shell">
        <div className="login-card">
          <div className="login-brand">
            <div className="login-logo">R</div>
            <h1>Registration disabled</h1>
            <p>Ask your workspace admin to invite or create an account for you.</p>
          </div>
          <div className="login-links" style={{ marginTop: 8 }}>
            Already have an account? &nbsp;<a href="/login">Sign in</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="login-shell"><div className="empty-state" style={{ color: "#a1a1aa" }}>Loading…</div></div>}>
      <SignUpForm />
    </Suspense>
  );
}
