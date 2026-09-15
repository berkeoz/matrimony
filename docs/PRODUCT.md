# Evlilik Yolu — Product Reference

A living reference for what's built, what's planned, and the open product decisions. Update this
alongside the code as features land.

## What's built (as of this doc)

- **Auth**: email/password signup, login, email verification, password reset. Combined
  `/login` + `/signup` page with a toggle. Google OAuth is wired but inactive until
  `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` are set.
- **Roles**: `MEMBER` (default), `ORGANIZER` (exists in the schema, no permissions wired up yet —
  see "Open questions"), `ADMIN` (full control).
- **Admin**: full CRUD on users (create/edit role/delete), events, success stories, homepage
  content, and the About/Privacy/Contact page text. All admin mutation routes are gated
  server-side, not just hidden in the UI.
- **Events**: city + venue + date/time, admin-managed, with a status (`OPEN`/`CLOSED`/
  `CANCELLED`/`COMPLETED`) layered on top of automatically computed "full" and "past" states.
- **RSVP lifecycle**: real per-user RSVPs (not a manual counter). Double opt-in — RSVPing sends a
  confirmation email, and the spot is only granted (confirmed or waitlisted, decided at confirm
  time) once that link is clicked. Automatic waitlist promotion when a confirmed attendee
  cancels. Automatic email if admin changes an event's date/time/venue, or cancels it. A daily
  cron job reminds confirmed attendees the day before their event.
- **Contact**: a real form that emails every admin, with basic spam protection (honeypot field +
  minimum-time-to-submit check).
- **Pages**: About, Privacy, and Contact intro text are admin-editable (plain text, not rich
  text/HTML — deliberately, to avoid needing to sanitize admin-authored HTML).

## What's not built yet

- **Member profiles** — no profile fields exist yet beyond name/email. This is the next major
  phase: photos, city/memleket, religion/sect, education, habits, bio, etc., plus self-service
  view/edit/delete and a "profile must be complete to do X" gate.
- **Matching** — express interest, mutual match detection.
- **Messaging** — chat between mutually matched members.
- **Payments** — nothing charges money yet (see Monetization below).
- **Rate limiting** — signup/login/forgot-password have no brute-force protection beyond what
  Vercel's platform provides. Worth a dedicated pass (see Security below) before real public
  traffic.

## Roles — what MEMBER / ORGANIZER / ADMIN actually mean today

- **MEMBER**: everyone who signs up. Can browse, RSVP to events.
- **ADMIN**: everything — user management, event/content CRUD, site configuration.
- **ORGANIZER**: exists as a role but currently behaves identically to MEMBER. Originally scoped
  as "a trusted community member who can create/manage their own events without full admin
  access," but events ended up admin-only by request. Either build this out for real (organizers
  create events, admin reviews/approves, or organizers get scoped access to just their own
  events) or remove the role until there's a concrete need — see "Open questions."

## Monetization

Nothing charges money today. Two things were explicitly deferred by the user to "come later":
payment for event RSVPs, and monetizing matching. Some options to weigh when that time comes,
roughly ordered by how well they fit a marriage-focused (not casual-dating) platform:

1. **Freemium contact/messaging reveal** — the classic matrimony-site model (common on South
   Asian and Middle Eastern matrimony platforms). Browsing and basic interest-expressing stay
   free; a subscription is required to message or see full contact details after a mutual match.
   Fits this platform's "serious intent" positioning well, and doesn't paywall the thing that
   builds trust (verification, profile completeness).
2. **Event ticketing** — charge a small fee for in-person meetups once they have a real venue
   cost. Straightforward to add on top of the existing RSVP system (a `priceCents` field on
   `Event`, a payment step between "confirmed" and "attending"). Lowest-risk place to start,
   since it's opt-in per event rather than gating the core product.
3. **Subscription tiers** — monthly/quarterly/annual, unlocking things like priority placement in
   search, seeing who expressed interest in you first, or unlimited event RSVPs vs. a free-tier
   cap. Standard SaaS-style recurring revenue; works well once there's a large enough active user
   base to justify it.
4. **Boosted/featured profiles** — pay to appear higher in search/suggestions. Common in dating
   apps generally, but can feel at odds with a "verified, trust-first" platform if not handled
   carefully (shouldn't let a bad-faith actor buy visibility over a well-vetted one).

**Recommendation for whenever this becomes real**: start with (2), event ticketing, since it's
additive and low-risk — no existing free feature gets taken away. Layer in (1) once matching
exists and there's something worth paywalling. Treat (3)/(4) as later optimization, not launch
requirements. None of this needs building now; flagging the shape of the decision so it's not a
surprise later.

## Scalability

- **Multi-city, multi-country**: already fine. `Event.city` is a free-text field with no
  assumptions baked in, and event times are stored as the event's own local wall-clock time (see
  `src/lib/datetime.ts`), not converted through a single server timezone — so an event in Berlin
  and one in Istanbul both just work, regardless of where the app server or the viewer are.
- **When it'll actually need work**: once there are enough cities/events that free-text city
  search stops being good enough (typos, "Istanbul" vs "İstanbul" vs "istanbul"), that's the
  trigger to normalize city into a proper lookup table with search/autocomplete. Not needed at
  current scale.
- **Profile search/matching at scale**: once profiles exist and search/matching gets built,
  Postgres full-text or a dedicated search index (e.g., a Postgres extension, or an external
  service if volume demands it) is the natural next step — not a concern for the MVP.

## Security posture

Done as part of this build:
- Password reset tokens: hashed at rest, single-use, 1-hour expiry, and the endpoint never
  reveals whether an email has an account (prevents enumeration).
- Email verification and RSVP-confirmation tokens: same pattern (hashed, single-use, expiring).
- Every admin mutation route re-checks `role === "ADMIN"` server-side — the UI hiding a button is
  not the security boundary.
- RSVP/cancel routes use the logged-in session's own user ID, never a client-supplied user ID —
  no IDOR path to act on someone else's RSVP.
- Contact form: honeypot field + minimum-submit-time check, and user-supplied content is
  HTML-escaped before being placed in the notification email (prevents HTML/script injection in
  an email an admin will open).
- RSVP double opt-in itself is a security property, not just a UX one: nobody can be signed up
  for an event just because someone else knows or guesses their email address.

Known gaps, not yet addressed:
- **No brute-force protection** on login or signup. A distributed/serverless-aware rate limiter
  (e.g., Upstash Redis + a sliding window, fronted by middleware) is the right fix when this goes
  fully public — not urgent while the user base is small and known, but shouldn't be forgotten.
- **No CAPTCHA** anywhere. Current spam defenses (honeypot, timing check) deter simple bots, not
  a determined attacker.
- **No audit log** of admin actions (who deleted which user, who cancelled which event). Worth
  adding once there's more than one admin.

## Open product questions (need a decision, not urgent)

- **Organizer role**: build it out, or drop it? (see Roles section)
- **Profiles visible pre-event**: should attendees RSVP'd to the same event be able to see each
  other's profile before showing up? Leaning yes, scoped strictly to co-attendees of that one
  event, never public — makes people more comfortable attending, but needs the privacy scoping
  built correctly from day one.
- **Matching + messaging**: next major phase after profiles, Bumble/Hinge/Tinder-style (express
  interest → mutual match → chat unlocks). No open question here, just sequencing.
