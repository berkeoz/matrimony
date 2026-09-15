import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OrganizerLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }
  if (session.user.role !== "ORGANIZER") {
    redirect("/");
  }

  return <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>;
}
