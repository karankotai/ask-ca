"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl,
      });

      if (!res) {
        setError("Authentication service unavailable.");
        setLoading(false);
        return;
      }

      if (res.error) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      if (res.url) {
        window.location.href = res.url;
      } else {
        window.location.href = callbackUrl;
      }
    } catch {
      setError("Unexpected error during login.");
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">R</div>
          <h1>Welcome to RegMitra</h1>
          <p>Sign in to access your workspace</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={onSubmit} className="login-form">
          <label className="login-field">
            <span className="login-field-label">Email</span>
            <input
              className="login-input"
              type="email"
              value={email}
              required
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="login-field-label">Password</span>
            <input
              className="login-input"
              type="password"
              value={password}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-submit"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="login-links">
          Don&apos;t have an account? &nbsp;<Link href="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
