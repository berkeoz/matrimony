import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  verifyUrl: string;
}) {
  const { to, name, verifyUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your email — Evlilik Yolu",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #be123c;">Welcome to Evlilik Yolu, ${name}</h2>
        <p>Please confirm your email address to finish setting up your account.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #be123c; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            Verify my email
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          Or paste this link into your browser: <br />
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}
