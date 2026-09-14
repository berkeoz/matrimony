"use client";

import { useState } from "react";

export default function VerifyEmailBanner() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleResend() {
    setStatus("sending");
    try {
      const res = await fetch("/api/resend-verification", { method: "POST" });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-6 py-3 text-center text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
      {status === "sent" ? (
        "Verification email sent — check your inbox."
      ) : (
        <>
          Please verify your email address.{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "sending"}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Resend verification email"}
          </button>
          {status === "error" && (
            <span className="ml-2 text-red-700 dark:text-red-400">
              Something went wrong. Try again shortly.
            </span>
          )}
        </>
      )}
    </div>
  );
}
