import { prisma } from "@/lib/prisma";
import { generateRawToken, hashToken } from "@/lib/tokens";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function createPasswordResetToken(email: string) {
  const rawToken = generateRawToken();

  await prisma.passwordResetToken.deleteMany({ where: { identifier: email } });
  await prisma.passwordResetToken.create({
    data: {
      identifier: email,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function consumePasswordResetToken(email: string, rawToken: string): Promise<boolean> {
  const hashed = hashToken(rawToken);

  const record = await prisma.passwordResetToken.findUnique({
    where: { identifier_token: { identifier: email, token: hashed } },
  });

  if (!record || record.expires < new Date()) {
    return false;
  }

  await prisma.passwordResetToken.delete({
    where: { identifier_token: { identifier: email, token: hashed } },
  });

  return true;
}
