import nodemailer from "nodemailer";
import { formatWallClockDate } from "@/lib/datetime";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(title: string, bodyHtml: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #be123c;">${title}</h2>
      ${bodyHtml}
    </div>
  `;
}

function button(url: string, label: string) {
  return `
    <p style="margin: 24px 0;">
      <a href="${url}" style="background: #be123c; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
        ${label}
      </a>
    </p>
  `;
}

export async function sendVerificationEmail(params: { to: string; name: string; verifyUrl: string }) {
  const { to, name, verifyUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Verify your email — Evlilik Yolu",
    html: shell(
      `Welcome to Evlilik Yolu, ${name}`,
      `
        <p>Please confirm your email address to finish setting up your account.</p>
        ${button(verifyUrl, "Verify my email")}
        <p style="color: #666; font-size: 13px;">
          Or paste this link into your browser: <br />
          <a href="${verifyUrl}">${verifyUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
      `
    ),
  });
}

export async function sendNewMessageEmail(params: {
  to: string;
  name: string;
  fromName: string;
  conversationUrl: string;
}) {
  const { to, name, fromName, conversationUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `${fromName} sent you a message`,
    html: shell(
      `Hi ${name}, you have a new message`,
      `
        <p><strong>${escapeHtml(fromName)}</strong> just messaged you.</p>
        ${button(conversationUrl, "Read message")}
      `
    ),
  });
}

export async function sendMatchEmail(params: {
  to: string;
  name: string;
  matchName: string;
  matchesUrl: string;
}) {
  const { to, name, matchName, matchesUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `It's a match! You and ${matchName}`,
    html: shell(
      `It's a match, ${name}!`,
      `
        <p>You and <strong>${escapeHtml(matchName)}</strong> have both expressed interest in each other.</p>
        ${button(matchesUrl, "View your matches")}
      `
    ),
  });
}

export async function sendPasswordResetEmail(params: { to: string; name: string; resetUrl: string }) {
  const { to, name, resetUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Reset your password — Evlilik Yolu",
    html: shell(
      `Reset your password, ${name}`,
      `
        <p>We received a request to reset your password. If this wasn't you, you can safely ignore this email.</p>
        ${button(resetUrl, "Reset my password")}
        <p style="color: #666; font-size: 13px;">
          Or paste this link into your browser: <br />
          <a href="${resetUrl}">${resetUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">This link expires in 1 hour.</p>
      `
    ),
  });
}

export async function sendContactMessageEmail(params: {
  to: string;
  fromName: string;
  fromEmail: string;
  message: string;
}) {
  const { to, fromName, fromEmail, message } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    replyTo: fromEmail,
    subject: `New contact message from ${fromName}`,
    html: shell(
      "New contact form message",
      `
        <p><strong>From:</strong> ${escapeHtml(fromName)} (${escapeHtml(fromEmail)})</p>
        <p style="white-space: pre-wrap; color: #444;">${escapeHtml(message)}</p>
      `
    ),
  });
}

export async function sendSubscriptionRequestEmail(params: {
  to: string;
  fromName: string;
  fromEmail: string;
  plan: "MONTHLY" | "YEARLY";
  manageUrl: string;
}) {
  const { to, fromName, fromEmail, plan, manageUrl } = params;
  const planLabel = plan === "MONTHLY" ? "Monthly" : "Yearly";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    replyTo: fromEmail,
    subject: `Subscription request from ${fromName} (${planLabel})`,
    html: shell(
      "New subscription request",
      `
        <p><strong>${escapeHtml(fromName)}</strong> (${escapeHtml(fromEmail)}) requested the
        <strong>${planLabel}</strong> plan.</p>
        <p style="color: #444;">No payment has been collected — arrange payment with them, then
        grant the subscription from the admin users page.</p>
        ${button(manageUrl, "Open admin users")}
      `
    ),
  });
}

export type EventEmailInfo = {
  title: string;
  venue: string;
  city: string;
  startsAt: Date;
  eventUrl: string;
};

function eventDetailsHtml(event: EventEmailInfo) {
  return `
    <p style="color: #444; font-size: 14px; line-height: 1.6;">
      <strong>${event.title}</strong><br />
      ${formatWallClockDate(event.startsAt)}<br />
      ${event.venue}, ${event.city}
    </p>
  `;
}

export async function sendRsvpPendingEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
  confirmUrl: string;
}) {
  const { to, name, event, confirmUrl } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Confirm your RSVP — ${event.title}`,
    html: shell(
      `One more step, ${name}`,
      `
        <p>Please confirm your RSVP by clicking the button below. Your spot isn't reserved until you do.</p>
        ${eventDetailsHtml(event)}
        ${button(confirmUrl, "Confirm my RSVP")}
        <p style="color: #666; font-size: 13px;">
          Or paste this link into your browser: <br />
          <a href="${confirmUrl}">${confirmUrl}</a>
        </p>
        <p style="color: #999; font-size: 12px;">This link expires in 48 hours.</p>
      `
    ),
  });
}

export async function sendRsvpConfirmationEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
  waitlisted: boolean;
}) {
  const { to, name, event, waitlisted } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: waitlisted
      ? `You're on the waitlist — ${event.title}`
      : `You're going! — ${event.title}`,
    html: shell(
      waitlisted ? `You're on the waitlist, ${name}` : `You're confirmed, ${name}!`,
      `
        <p>${
          waitlisted
            ? "This event is currently full. We'll email you right away if a spot opens up."
            : "You're RSVP'd for this event. We'll send you a reminder the day before."
        }</p>
        ${eventDetailsHtml(event)}
        ${button(event.eventUrl, "View event")}
      `
    ),
  });
}

export async function sendWaitlistPromotedEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
}) {
  const { to, name, event } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `A spot opened up — ${event.title}`,
    html: shell(
      `Good news, ${name} — you're in!`,
      `
        <p>A spot opened up and you've been moved from the waitlist to confirmed.</p>
        ${eventDetailsHtml(event)}
        ${button(event.eventUrl, "View event")}
      `
    ),
  });
}

export async function sendEventUpdatedEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
  changes: string[];
}) {
  const { to, name, event, changes } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Event updated — ${event.title}`,
    html: shell(
      `Hi ${name}, this event has changed`,
      `
        <p>The organizer updated ${changes.join(" and ")} for an event you RSVP'd to:</p>
        ${eventDetailsHtml(event)}
        ${button(event.eventUrl, "View updated details")}
      `
    ),
  });
}

export async function sendEventCancelledEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
}) {
  const { to, name, event } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Event cancelled — ${event.title}`,
    html: shell(
      `Hi ${name}, this event has been cancelled`,
      `
        <p>We're sorry — the following event has been cancelled:</p>
        ${eventDetailsHtml(event)}
        <p style="color: #666; font-size: 13px;">Check the Events page for other upcoming meetups.</p>
      `
    ),
  });
}

export async function sendEventApprovedEmail(params: { to: string; name: string; eventTitle: string }) {
  const { to, name, eventTitle } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your event was approved — ${eventTitle}`,
    html: shell(
      `Hi ${name}, your event is live`,
      `
        <p><strong>${escapeHtml(eventTitle)}</strong> has been approved and is now visible on the
        Events page.</p>
      `
    ),
  });
}

export async function sendEventRejectedEmail(params: { to: string; name: string; eventTitle: string }) {
  const { to, name, eventTitle } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Your event wasn't approved — ${eventTitle}`,
    html: shell(
      `Hi ${name}`,
      `
        <p><strong>${escapeHtml(eventTitle)}</strong> wasn't approved for the public Events page.
        Reach out to an admin if you'd like to know why, or edit and resubmit it.</p>
      `
    ),
  });
}

export async function sendEventReminderEmail(params: {
  to: string;
  name: string;
  event: EventEmailInfo;
}) {
  const { to, name, event } = params;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `Reminder: tomorrow — ${event.title}`,
    html: shell(
      `See you tomorrow, ${name}!`,
      `
        <p>This is a reminder that you're RSVP'd for an event happening tomorrow:</p>
        ${eventDetailsHtml(event)}
        ${button(event.eventUrl, "View event")}
      `
    ),
  });
}
