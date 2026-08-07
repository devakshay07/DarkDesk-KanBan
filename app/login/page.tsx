"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/AuthProvider";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, signInWithMagicLink } = useAuth();

  // If Supabase isn't configured, skip login
  if (!supabase) {
    if (typeof window !== "undefined") router.replace("/");
    return null;
  }

  // Already logged in
  if (!loading && user) {
    router.replace("/");
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      let result: string | null = null;

      if (mode === "magic") {
        result = await signInWithMagicLink(email);
        if (!result) setMessage("Check your email for a login link!");
      } else if (mode === "signup") {
        result = await signUp(email, password);
        if (!result) setMessage("Account created! Check your email to confirm, then sign in.");
      } else {
        result = await signIn(email, password);
        if (!result) router.replace("/");
      }

      if (result) setError(result);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="loading"><div className="orb" /> Loading…</main>;
  }

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="login-logo"><span>◆</span> DarkDesk</div>
        <p className="login-subtitle">Your focused Kanban workspace</p>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === "signin" ? "active" : ""}
            onClick={() => { setMode("signin"); setError(null); setMessage(null); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={mode === "signup" ? "active" : ""}
            onClick={() => { setMode("signup"); setError(null); setMessage(null); }}
          >
            Sign Up
          </button>
          <button
            type="button"
            className={mode === "magic" ? "active" : ""}
            onClick={() => { setMode("magic"); setError(null); setMessage(null); }}
          >
            Magic Link
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </label>

          {mode !== "magic" && (
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </label>
          )}

          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-success">{message}</div>}

          <button type="submit" className="login-submit" disabled={submitting}>
            {submitting
              ? "Working…"
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Magic Link"}
          </button>
        </form>
      </div>
    </main>
  );
}
