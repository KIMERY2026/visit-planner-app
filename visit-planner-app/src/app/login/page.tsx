"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push(params.get("callbackUrl") || "/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-surface border border-line/20 rounded-2xl p-8 shadow-sm">
        <h1 className="font-display text-2xl font-semibold mb-1">Visit Planner</h1>
        <p className="text-muted text-sm mb-6">Sign in to plan and log constituency visits.</p>

        <label className="block text-xs font-semibold text-muted mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm"
        />

        <label className="block text-xs font-semibold text-muted mb-1">Password</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 rounded-lg border border-line/20 bg-bg px-3 py-2 text-sm"
        />

        {error && <p className="text-danger text-sm mb-4">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>

        <p className="text-muted text-xs mt-5">
          Seeded accounts (see README): mp@example.org / assistant@example.org / staff@example.org — password{" "}
          <code>password123</code>.
        </p>
      </form>
    </div>
  );
}
