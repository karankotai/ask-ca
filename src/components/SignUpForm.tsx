"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account.");
        return;
      }
      router.push(`/login?signup=${encodeURIComponent(email)}`);
      router.refresh();
    } catch {
      setError("Could not connect to registration service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">R</div>
          <h1>Create your account</h1>
          <p>Register to join RegMitra workspace</p>
        </div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={onSubmit} className="login-form">
          <label className="login-field">
            <span className="login-field-label">Full name</span>
            <input
              className="login-input"
              type="text"
              value={name}
              autoComplete="name"
              autoFocus
              placeholder="e.g. Priya Sharma"
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="login-field-label">Email</span>
            <input
              className="login-input"
              type="email"
              value={email}
              required
              autoComplete="email"
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
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="login-field">
            <span className="login-field-label">Confirm password</span>
            <input
              className="login-input"
              type="password"
              value={confirmPassword}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary login-submit"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="login-links">
          Already have an account? &nbsp;<Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
