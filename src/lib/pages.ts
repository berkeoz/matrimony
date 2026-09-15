import { prisma } from "@/lib/prisma";

export async function getPage(slug: string) {
  return prisma.page.findUnique({ where: { slug } });
}
