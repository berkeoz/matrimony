import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VerifyEmailBanner from "@/components/VerifyEmailBanner";
import { auth } from "@/lib/auth";
import { getTotalUnreadCount } from "@/lib/messaging";
import { getReceivedLikesCount } from "@/lib/matching";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Evlilik Yolu — Turkish Matrimony Community",
  description:
    "A marriage-focused community platform for Turkish singles, at home and abroad. Build a verified profile, connect with intention, and meet the community in person at local events.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const needsVerification = Boolean(session?.user) && !session?.user.emailVerified;
  const [unreadCount, likesCount] = session?.user
    ? await Promise.all([getTotalUnreadCount(session.user.id), getReceivedLikesCount(session.user.id)])
    : [0, 0];

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Header session={session} unreadCount={unreadCount} likesCount={likesCount} />
        {needsVerification && <VerifyEmailBanner />}
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
