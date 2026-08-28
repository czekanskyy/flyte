# ADR 0005 – Better Auth, self-hosted, over Auth.js and Neon Managed Better Auth

**Status:** Accepted · **Date:** 2026-08-28 · **Supersedes:** – · **Superseded by:** –

## Context

The product requires four sign-in methods: email and password, Google OAuth, magic link, and
**passkeys**. Passkeys are not a nice-to-have. The application is used outdoors, in gloves, in
sunlight, where typing a password is awkward.

Auth.js (Auth.js / next-auth) still treats WebAuthn as experimental. That is the specific reason
it was not chosen.

Neon now offers Better Auth as a managed service with per-branch auth environments. Checked on
2026-08-28: its supported plugin set is Admin, Email OTP, JWT, Magic Link, Organization (partial),
Open API and Phone Number. **Passkeys are absent and not on the published roadmap.** It is also
beta, targeting GA "this quarter", with pricing not yet published, and it would tie the auth
layer to Neon – against [ADR 0004](0004-neon-postgis.md), which treats Neon as ordinary Postgres.

Self-hosted Better Auth with the Drizzle adapter puts the auth tables in the same branch database,
so branch isolation comes free from Neon branching without the managed layer.

## Decision

**Self-hosted Better Auth** (`better-auth` pinned in the catalog), Drizzle adapter, Argon2id
password hashing, four methods:

| Method | Extra owner credential | Behaviour if missing |
|---|---|---|
| Email and password | none | Always on |
| Passkeys | none | Always on |
| Google OAuth | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Button hidden when unset |
| Magic link | SMTP settings | Form hidden when unset |

Sessions are database-backed. No JWT-as-session. The secret is `BETTER_AUTH_SECRET`.

## Consequences

- All four methods are production-supported, including passkeys.
- Auth schema lives next to application schema and follows Neon branches.
- Google and magic link can ship disabled without blocking email/password or passkeys.
- Revisit Neon Managed Better Auth only if passkey support ships and reaches GA. Until then this
  document is the answer to "why are we not using the managed option?"
