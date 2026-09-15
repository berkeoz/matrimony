# Evlilik Yolu — Product Reference

A living reference for what's built, what's planned, and the open product decisions. Update this
alongside the code as features land.

## Links

- **Production**: https://matrimony-tan.vercel.app
- **Repo**: https://github.com/berkeoz/matrimony
- **Vercel project**: `berke10/matrimony`
- **Database**: Neon Postgres, provisioned via the Vercel Storage integration

## Architecture

- **Framework**: Next.js (App Router, Turbopack), TypeScript, Tailwind CSS.
- **Data**: Prisma ORM over PostgreSQL (Neon). Models: `User`, `Account`/`Session`/
  `VerificationToken` (Auth.js), `PasswordResetToken`, `Page`, `SuccessStory`, `Event`/
  `EventRsvp`, `Profile`/`ProfilePhoto`, `HomepageContent`, `Interest`/`Pass`/`Match`, `Message`,
  `Subscription`, `AuditLog`.
- **CAPTCHA**: Cloudflare Turnstile on signup, forgot-password, and contact — free, unlimited.
  Inactive (renders nothing, verification skipped) until `NEXT_PUBLIC_TURNSTILE_SITE_KEY` /
  `TURNSTILE_SECRET_KEY` are set, same "wired but inactive" pattern as Google OAuth.
- **Auth**: Auth.js (NextAuth) v5, Credentials provider + Prisma adapter, JWT sessions. Google
  OAuth is wired but inactive until its env vars are set.
- **File storage**: Vercel Blob (public access) for profile photos.
- **Email**: Gmail SMTP via nodemailer, used for every transactional email (verification,
  password reset, RSVP confirm/cancel/reminder, contact form, match, first message).
- **Validation**: Zod schemas on every mutating API route, server-side.
- **Security conventions**: admin routes re-check the role server-side (never UI-only); mutating
  routes act on `session.user.id`, never a client-supplied user id (no IDOR path); all
  email-verification / password-reset / RSVP-confirm tokens follow the same pattern — a random
  token is emailed, only its SHA-256 hash is stored, and it's single-use and expiring.
- **Datetime convention**: event times are stored and rendered as "naive wall-clock" values (see
  `src/lib/datetime.ts`), not run through a single server timezone — so an event's displayed time
  is the same for the organizer in Istanbul and a browser in Toronto.
- **"Real-time" chat**: polling every 4 seconds, no WebSockets. Simple and fine at current scale;
  revisit if message volume or user count grows a lot.

## Site map

**Public**: `/` (home), `/events`, `/events/[slug]`, `/about`, `/privacy`, `/contact`,
`/login`, `/signup`, `/forgot-password`, `/reset-password`, `/verify-email`, `/rsvp-confirmed`.

**Member** (requires login): `/profile`, `/browse`, `/browse/[userId]` (profile detail), `/likes`,
`/matches`, `/matches/[matchId]` (chat thread), `/subscribe`.

**Organizer** (requires `ORGANIZER` role): `/organizer/events`.

**Admin** (requires `ADMIN` role): `/admin`, `/admin/users`, `/admin/events`,
`/admin/success-stories`, `/admin/homepage`, `/admin/pages`, `/admin/audit-log`.

**API**: REST-ish routes under `/api/*` mirroring the above — auth (`/api/signup`,
`/api/forgot-password`, `/api/reset-password`, `/api/verify-email`, `/api/resend-verification`,
`/api/auth/[...nextauth]`), account (`/api/account`), profile (`/api/profile`,
`/api/profile/photos`, `/api/profile/photos/[id]`), events (`/api/events/[slug]/rsvp`,
`/api/events/rsvp-confirm`), matching (`/api/browse`, `/api/interest`, `/api/pass`,
`/api/matches/[matchId]/messages`), subscriptions (`/api/subscribe-request`), organizer's own
events (`/api/organizer/events`, `/api/organizer/events/[id]`), contact (`/api/contact`), admin
(`/api/admin/*`, including `/api/admin/events/[id]/review` for approving/rejecting organizer
events), and a daily cron (`/api/cron/event-reminders`).

## What's built (as of this doc)

- **Auth**: email/password signup, login, email verification, password reset. Combined
  `/login` + `/signup` page with a toggle. Google OAuth is wired but inactive until
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set.
- **Roles**: `MEMBER` (default), `ORGANIZER` (exists in the schema, no permissions wired up yet —
  see "Open questions"), `ADMIN` (full control).
- **Admin**: full CRUD on users (create/edit role/delete), events, success stories, homepage
  content, and the About/Privacy/Contact page text. Can view and remove an event's attendees. All
  admin mutation routes are gated server-side, not just hidden in the UI.
- **Events**: city + venue + date/time, admin-managed, with a status (`OPEN`/`CLOSED`/
  `CANCELLED`/`COMPLETED`) layered on top of automatically computed "full" and "past" states. A
  Google Maps link is generated from city + venue (no embedded map, no API key needed).
- **RSVP lifecycle**: real per-user RSVPs (not a manual counter). Double opt-in — RSVPing sends a
  confirmation email, and the spot is only granted (confirmed or waitlisted, decided at confirm
  time) once that link is clicked. Automatic waitlist promotion when a confirmed attendee
  cancels. Automatic email if admin changes an event's date/time/venue, or cancels it. A daily
  cron job reminds confirmed attendees the day before their event. Event creation itself never
  auto-notifies members (deliberate — avoids spamming on every new event).
- **Attendee visibility**: RSVP'd members can see who else is confirmed for that event (photo,
  age, city) — reciprocal, scoped to co-attendees of that one event, never a public list.
- **Contact**: a real form that emails every admin, with basic spam protection (honeypot field +
  minimum-time-to-submit check).
- **Pages**: About, Privacy, and Contact intro text are admin-editable (plain text, not rich
  text/HTML — deliberately, to avoid needing to sanitize admin-authored HTML).
- **Member profiles**: self-service view/edit/delete, photo upload (Vercel Blob), and a
  completeness gate — a profile must have every field plus at least one photo filled in before
  the member can RSVP to events or use Browse/matching. Deliberately excludes religion/sect and
  family-involvement fields for now.
- **Browse & matching**: filterable grid (city, age range, education, marital status, children,
  smoking/alcohol), opposite-gender only, excludes anyone already interested-in/passed/matched.
  Express interest or pass on a card; a mutual "express interest" from both sides creates a
  `Match` and emails both members. One-sided interest never emails anyone (avoids notification
  spam / awkwardness if it's never reciprocated).
- **Profile detail view** (`/browse/[userId]`): clicking a Browse card (or a Received Like) opens
  the candidate's full profile, gated the same way Browse itself is (opposite gender, complete
  profile only — a guessed `userId` 404s otherwise). Free members see the same summary Browse
  already shows (name, age, city, memleket, profession, one photo); subscribers additionally see
  every photo, country, height, education, marital status, children, smoking/alcohol, "About",
  and "Looking for" — with a "Subscribe to see the full profile" prompt in place of that section
  for free members. Express Interest / Pass work from this page too, sharing the same free-tier
  cap and API routes as Browse.
- **Received Likes** (`/likes`): people who've expressed interest in you that you haven't
  matched with (or passed on) yet. Free members see only a count ("3 people liked you") with a
  subscribe prompt; subscribers see the actual list and can act on each one immediately instead
  of hoping to stumble across them in Browse. The nav bar shows a badge with the (always-visible,
  even for free members) count — the count itself is the hook, revealing *who* is what's gated.
- **Messaging**: matched members get a chat thread (`/matches/[matchId]`), polling every 4
  seconds. `/matches` lists conversations with a last-message preview and unread count; the nav
  bar shows a badge with the total unread count. Only the *first* message in a new conversation
  emails the recipient — every message after that is silent (check unread badge / conversation
  list instead).
- **Paid events & subscriptions**: an `Event` can have a `priceCents` (0 = free, the default).
  A `Subscription` (`MONTHLY` or `YEARLY`, on `User`) makes every event free for that member
  regardless of its price, and also lifts the two free-tier caps below. There's no self-serve way
  to buy a subscription yet — no payment processor is wired up (see "What's not built yet") — so
  today an admin grants/extends/cancels a member's subscription by hand from `/admin/users`
  (`src/lib/subscription.ts`: `grantSubscription`/`cancelSubscription`; granting again before
  expiry stacks the extra time rather than overwriting it). A priced event simply can't be
  RSVP'd to by a non-subscriber yet — `RsvpButton` shows "Payment coming soon" instead of a
  working button, and the RSVP API rejects it server-side too (`code: "PAYMENT_NOT_AVAILABLE"`).
  A subscriber sees a normal RSVP button and a "free for you — subscriber" note.
- **Requesting a subscription**: `/subscribe` shows three pricing cards — Free, Monthly
  ($19.99/mo), Yearly ($199/yr, "2 months free" vs. paying monthly) — each listing what that
  tier includes, with the member's current plan highlighted. Yearly gets one extra perk Monthly
  doesn't: free refreshments at events — a manual, in-person perk (checked against the
  subscriber's plan at the door), not something the app tracks or enforces. Hitting "Request
  Monthly/Yearly" emails every admin (`sendSubscriptionRequestEmail`, same all-admins pattern as the Contact
  form) with a link straight to `/admin/users`, but collects no payment and creates no
  subscription by itself; the admin still arranges payment out of band and grants it manually.
  Every "subscribe to unlock more" mention in the product (the Browse interest-cap banner, the
  messaging-limit banner, the paid-event RSVP block) links to this page. The displayed prices
  are hardcoded (`PLAN_PRICE_CENTS` in `src/lib/subscription.ts`) since nothing can charge them
  yet — they'll need to become real Stripe Price objects once billing is wired up.
- **Free-tier caps**: a non-subscribed member can express interest in at most **2** people
  total (`FREE_INTEREST_LIMIT` in `src/lib/matching.ts`) — passing stays unlimited, since it's
  interest (the thing that actually consumes matchmaking value) that's gated, not looking.
  Browse shows a usage banner ("You've expressed interest in X of 2 free profiles") and disables
  the button once at the cap; the `/api/interest` route enforces the same limit server-side. A
  non-subscribed member can also only *send* messages in **2** distinct matches
  (`FREE_MESSAGE_LIMIT` in `src/lib/messaging.ts`) — a conversation already started keeps
  working past the cap, only starting a new one is blocked, and the match/conversation itself is
  never hidden, just read-only. Both limits are lifted entirely by an active subscription.
- **Match → chat handoff**: a mutual match on Browse shows "It's a match! 🎉 Start chatting →"
  as a link straight into the new `/matches/[matchId]` thread (`expressInterest` in
  `src/lib/matching.ts` returns the `matchId`), instead of just an inline badge.
- **Read receipts**: the chat thread shows "Seen" under the last message you sent, once the
  other person has opened the conversation (`Message.readAt`, already tracked, now surfaced in
  `ChatThread.tsx`).
- **Organizer role**: an `ORGANIZER` can create their own events from `/organizer/events`.
  Organizer events are always free (price is forced to 0 server-side) and start in `PENDING`
  review — invisible on the public Events page and blocked from RSVP until an admin approves
  them from `/admin/events` (`Event.reviewStatus`: `PENDING`/`APPROVED`/`REJECTED`). Approving or
  rejecting emails the organizer. Organizers can view and remove their own event's attendees
  (the same tool admin already had, now also scoped to the owning organizer) but can't otherwise
  touch anyone else's events, and have no access to `/admin`.
- **Event format field**: `Event.format` is free text shown as a "What to expect" section on the
  event page — e.g. explaining a speed-dating round structure. New events default to a
  speed-dating explanation (`DEFAULT_EVENT_FORMAT` in `src/lib/events.ts`: ~5–10 minutes per
  person before rotating), editable or clearable per event. Any "who do you want to see again"
  decision is handled live at the event itself, not by the app.
- **CAPTCHA**: Cloudflare Turnstile on signup, forgot-password, and contact. A failed check is
  treated identically to the existing honeypot/timing checks (a silent no-op), so a bot can't
  tell which defense caught it.
- **Audit log**: every admin (and organizer) mutation — user create/update/delete, subscription
  grant/cancel, event create/update/delete/approve/reject, attendee removal, success story and
  homepage/page edits — is recorded in `AuditLog` (`src/lib/audit.ts`) with who did it and when,
  viewable at `/admin/audit-log`.

## What's not built yet

- **An actual payment processor** — no Stripe (or similar) integration exists. Nothing charges a
  card today; subscriptions are admin-granted by hand and priced events can't be paid for by
  anyone (see Monetization below for the planned Stripe Checkout + webhook shape).
- **Rate limiting** — signup/login/forgot-password have no brute-force protection beyond what
  Vercel's platform provides and the new CAPTCHA. Worth a dedicated pass (see Security below)
  before real public traffic.
- **Custom event fields** — beyond the new `format` field, `Event` still has a fixed field set
  (title, description, city, venue, date, organizer, capacity, price). There's no way for an
  admin to add arbitrary event-specific fields (e.g. an RSVP question like dietary restrictions).
  See "Open questions."
- **Subscription self-checkout** — `/subscribe` lets a member *request* a plan (emails the
  admin), but there's no way to actually pay for or self-activate one; it's still admin-granted
  after the fact.
- **Organizer event resubmission UX** — editing a `REJECTED` event resets it to `PENDING` for a
  fresh review (so an organizer can fix and resubmit), but there's no in-app explanation of *why*
  it was rejected beyond the admin reaching out directly.

## Roles — what MEMBER / ORGANIZER / ADMIN actually mean today

- **MEMBER**: everyone who signs up. Can browse, RSVP to events, use matching/messaging once
  their profile is complete.
- **ADMIN**: everything — user management, event/content CRUD, site configuration.
- **ORGANIZER**: a trusted community member who can create and manage their own events from
  `/organizer/events`, always free and subject to admin approval before going public (see
  "Organizer role" above). No access to `/admin` or anyone else's events/users/content.

## Monetization

The data model and gating logic are built (see "Paid events & subscriptions" above); no payment
processor is wired up yet, so nothing actually charges a card. The plan, in order:

1. **Freemium interest/messaging caps** — done at the data/logic layer. A free member can
   express interest in 2 people and message 2 matches; a `Subscription` lifts both caps. Fits
   this platform's "serious intent" positioning well, and doesn't paywall the thing that builds
   trust (verification, profile completeness, browsing itself stays unlimited).
2. **Event ticketing** — done at the data/logic layer. `Event.priceCents` (0 = free) plus the
   subscription fee waiver. What's missing is the payment step itself — see below.
3. **Stripe integration (next step for both of the above)** — Stripe Checkout (a hosted payment
   page, so card numbers never touch this server) for one-off event payments, and Stripe
   Billing/Subscriptions for the monthly/yearly plans, with a `/api/webhooks/stripe` route as the
   source of truth for "did this actually get paid" (never trust a client-side redirect alone —
   same principle as the existing RSVP double opt-in). Needs `STRIPE_SECRET_KEY`,
   `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. Business-side groundwork needed first: a
   real Stripe account tied to a bank payout, a decision on who's the merchant of record, one
   settlement currency to start (not per-country pricing), and awareness of tax/VAT obligations
   on ticket sales — none of that is a code decision.
4. **Subscription self-checkout page** — once Stripe Billing exists, a pricing page so members
   can subscribe themselves instead of the admin granting it by hand.
5. **Boosted/featured profiles** — pay to appear higher in search/suggestions. Common in dating
   apps generally, but can feel at odds with a "verified, trust-first" platform if not handled
   carefully (shouldn't let a bad-faith actor buy visibility over a well-vetted one). Lowest
   priority, not scoped at all yet.

**Recommendation for whenever Stripe gets wired up**: do event payments and subscription billing
in the same pass, since they share the same webhook infrastructure and the subscription fee-waiver
already depends on both existing. Treat (5) as later optimization, not a launch requirement.

## Scalability

- **Multi-city, multi-country**: already fine. `Event.city` is a free-text field with no
  assumptions baked in, and event times are stored as the event's own local wall-clock time (see
  `src/lib/datetime.ts`), not converted through a single server timezone — so an event in Berlin
  and one in Istanbul both just work, regardless of where the app server or the viewer are.
- **When it'll actually need work**: once there are enough cities/events that free-text city
  search stops being good enough (typos, "Istanbul" vs "İstanbul" vs "istanbul"), that's the
  trigger to normalize city into a proper lookup table with search/autocomplete. Not needed at
  current scale.
- **Profile search/matching at scale**: Browse currently does a straightforward filtered Prisma
  query over `Profile`. Fine at current scale; once there are enough profiles that filtering
  and pagination get slow, Postgres full-text or a dedicated search index is the natural next
  step.
- **Chat at scale**: 4-second polling is simple and cheap at low user/message counts. If message
  volume grows a lot, revisit toward WebSockets or a push-based approach (e.g. Pusher/Ably, or a
  Postgres `LISTEN/NOTIFY`-backed approach) — not needed yet.

## Security posture

Done as part of this build:
- Password reset tokens: hashed at rest, single-use, 1-hour expiry, and the endpoint never
  reveals whether an email has an account (prevents enumeration).
- Email verification and RSVP-confirmation tokens: same pattern (hashed, single-use, expiring).
- Every admin mutation route re-checks `role === "ADMIN"` server-side — the UI hiding a button is
  not the security boundary.
- RSVP/cancel, profile, browse/interest/pass, and messaging routes all use the logged-in
  session's own user ID, never a client-supplied user ID — no IDOR path to act on someone else's
  data.
- Messaging routes verify the requesting user is actually part of the `Match` before returning or
  accepting messages for a `matchId` — a guessed/enumerated match id can't be read into.
- The free-tier interest/message caps and the paid-event RSVP block are all enforced
  server-side (`/api/interest`, `/api/matches/[matchId]/messages`, `/api/events/[slug]/rsvp`),
  not just hidden in the UI — confirmed by calling each route directly, bypassing the disabled
  buttons.
- Organizer routes re-verify ownership server-side on every request (`event.organizerId ===
  session.user.id`) — confirmed by calling the attendee-removal route as an organizer against an
  event they don't own (403), not just relying on the UI not showing the button.
- Every admin (and organizer) mutation writes an `AuditLog` entry — who, what, when — so actions
  are traceable after the fact, not just prevented in the moment.
- Contact form: honeypot field + minimum-submit-time check, and user-supplied content is
  HTML-escaped before being placed in the notification email (prevents HTML/script injection in
  an email an admin will open).
- RSVP double opt-in itself is a security property, not just a UX one: nobody can be signed up
  for an event just because someone else knows or guesses their email address.
- Account deletion calls `signOut()` (not just a redirect) so the JWT session cookie is actually
  invalidated, not left pointing at a deleted user.

Known gaps, not yet addressed:
- **No brute-force protection** on login or signup. A distributed/serverless-aware rate limiter
  (e.g., Upstash Redis + a sliding window, fronted by middleware) is the right fix when this goes
  fully public — CAPTCHA deters bots, but doesn't cap attempt rate the way a rate limiter would.

## Open product questions (need a decision, not urgent)

- **Custom event fields**: worth building beyond the new `format` field, and if so, how
  flexible? A small fixed set of *optional* extra fields (e.g. an RSVP question like dietary
  restrictions) vs. a fully generic key/value custom-field builder the admin defines per event —
  the former is much less work and covers most realistic needs.
- **Rate limiting / brute-force protection**: when to prioritize this before it becomes a real
  incident, given the site is not yet under significant traffic.
- **Are the free-tier caps (2 interests, 2 conversations) and lack of subscription pricing right
  long-term?** Both limits are simple constants (`FREE_INTEREST_LIMIT`, `FREE_MESSAGE_LIMIT`),
  not admin-configurable, and there's no stored price for the MONTHLY/YEARLY plans since nothing
  can charge for them yet. Worth revisiting — admin-configurable caps, and real plan pricing —
  once Stripe billing is actually being built, rather than guessing at the right knobs now.
