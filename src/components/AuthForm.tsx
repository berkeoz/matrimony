"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import TurnstileWidget from "@/components/TurnstileWidget";

export default function AuthForm({ defaultMode }: { defaultMode: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  function switchTo(next: "login" | "signup") {
    setMode(next);
    setError(null);
    router.push(next === "login" ? "/login" : "/signup");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, turnstileToken }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      const signInResult = await signIn("credentials", { email, password, redirect: false });
      if (signInResult?.error) {
        switchTo("login");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <div className="flex rounded-full border border-black/10 p-1 dark:border-white/10">
        <button
          type="button"
          onClick={() => switchTo("login")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            mode === "login" ? "bg-rose-700 text-white" : "text-neutral-600 dark:text-neutral-300"
          }`}
        >
          Log In
        </button>
        <button
          type="button"
          onClick={() => switchTo("signup")}
          className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
            mode === "signup" ? "bg-rose-700 text-white" : "text-neutral-600 dark:text-neutral-300"
          }`}
        >
          Sign Up
        </button>
      </div>

      {mode === "login" ? (
        <>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Log in</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Welcome back to Evlilik Yolu.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-rose-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>
        </>
      ) : (
        <>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
            Join a marriage-focused community built on trust and intention.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-rose-700 dark:border-white/15"
              />
              <p className="mt-1 text-xs text-neutral-500">At least 8 characters.</p>
            </div>

            <TurnstileWidget onVerify={setTurnstileToken} />

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-rose-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
