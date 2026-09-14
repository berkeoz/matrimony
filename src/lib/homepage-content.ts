import { prisma } from "@/lib/prisma";

export type HomepageSection = { title: string; description: string };

export type HomepageContentData = {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  howItWorks: HomepageSection[];
  trustPoints: HomepageSection[];
  ctaTitle: string;
  ctaDescription: string;
};

const fallback: HomepageContentData = {
  heroBadge: "For the Turkish community, at home and abroad",
  heroTitle: "A marriage-minded community, built on trust.",
  heroSubtitle:
    "Evlilik Yolu helps Turkish singles build verified profiles, connect with serious intent, and meet the community in person.",
  howItWorks: [],
  trustPoints: [],
  ctaTitle: "Ready to start your search with intention?",
  ctaDescription: "Join a community built around marriage, trust, and family.",
};

export async function getHomepageContent(): Promise<HomepageContentData> {
  const row = await prisma.homepageContent.findUnique({ where: { id: "homepage" } });
  if (!row) return fallback;

  return {
    heroBadge: row.heroBadge,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    howItWorks: row.howItWorks as HomepageSection[],
    trustPoints: row.trustPoints as HomepageSection[],
    ctaTitle: row.ctaTitle,
    ctaDescription: row.ctaDescription,
  };
}
