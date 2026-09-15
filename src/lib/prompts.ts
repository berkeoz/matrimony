import { prisma } from "@/lib/prisma";

export const MAX_PROMPT_ANSWERS = 3;

export async function getActivePrompts() {
  return prisma.prompt.findMany({ where: { active: true }, orderBy: { order: "asc" } });
}

export async function getAllPrompts() {
  return prisma.prompt.findMany({ orderBy: { order: "asc" } });
}

export type ProfilePromptAnswerView = {
  promptId: string;
  prompt: string;
  answer: string;
};

export async function getProfilePromptAnswers(profileId: string): Promise<ProfilePromptAnswerView[]> {
  const answers = await prisma.profilePromptAnswer.findMany({
    where: { profileId },
    orderBy: { order: "asc" },
    include: { prompt: { select: { text: true } } },
  });
  return answers.map((a) => ({ promptId: a.promptId, prompt: a.prompt.text, answer: a.answer }));
}

export type UpsertPromptAnswerResult = { ok: true } | { ok: false; error: string };

export async function upsertPromptAnswer(
  profileId: string,
  promptId: string,
  answer: string
): Promise<UpsertPromptAnswerResult> {
  const prompt = await prisma.prompt.findUnique({ where: { id: promptId } });
  if (!prompt || !prompt.active) {
    return { ok: false, error: "Prompt not found." };
  }

  const existing = await prisma.profilePromptAnswer.findUnique({
    where: { profileId_promptId: { profileId, promptId } },
  });

  if (!existing) {
    const count = await prisma.profilePromptAnswer.count({ where: { profileId } });
    if (count >= MAX_PROMPT_ANSWERS) {
      return { ok: false, error: `You can only answer up to ${MAX_PROMPT_ANSWERS} prompts.` };
    }
  }

  await prisma.profilePromptAnswer.upsert({
    where: { profileId_promptId: { profileId, promptId } },
    create: { profileId, promptId, answer, order: existing?.order ?? (await prisma.profilePromptAnswer.count({ where: { profileId } })) },
    update: { answer },
  });

  return { ok: true };
}

export async function deletePromptAnswer(profileId: string, promptId: string): Promise<void> {
  await prisma.profilePromptAnswer.deleteMany({ where: { profileId, promptId } });
}
