import nodemailer from "nodemailer";
import { formatWallClockDate } from "@/lib/datetime";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

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
