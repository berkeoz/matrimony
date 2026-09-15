import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function requireOrganizer() {
  const session = await auth();
  if (!session?.user) {
    return { session: null, response: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  }
  if (session.user.role !== "ORGANIZER") {
    return { session: null, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { session, response: null };
}
