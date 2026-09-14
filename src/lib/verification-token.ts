import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createVerificationToken(email: string) {
  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function consumeVerificationToken(email: string, rawToken: string) {
  const hashed = hashToken(rawToken);

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token: hashed } },
  });

  if (!record || record.expires < new Date()) {
    return false;
  }

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token: hashed } },
  });

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return true;
}
