// Cloudflare Turnstile — free, unlimited CAPTCHA. If TURNSTILE_SECRET_KEY isn't
// set (no site configured yet), verification is skipped rather than blocking
// every submission, mirroring how Google OAuth is "wired but inactive" here.
export async function verifyTurnstile(token: string | null | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token }),
  });
  const data = await res.json().catch(() => ({ success: false }));
  return Boolean(data.success);
}
