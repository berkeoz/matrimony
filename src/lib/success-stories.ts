import type { SuccessStory } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type { SuccessStory };

export async function getSuccessStories(): Promise<SuccessStory[]> {
  return prisma.successStory.findMany({ orderBy: { order: "asc" } });
}
