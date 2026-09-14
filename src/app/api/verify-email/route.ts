import { NextResponse } from "next/server";
import { consumeVerificationToken } from "@/lib/verification-token";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return NextResponse.redirect(`${origin}/verify-email?status=invalid`);
  }

  const success = await consumeVerificationToken(email, token);

  return NextResponse.redirect(
    `${origin}/verify-email?status=${success ? "success" : "invalid"}`
  );
}
