---
id: FLY-014
title: "Better Auth: email/password, passkeys, Google, magic link"
status: done
phase: 1
depends_on: [FLY-012, FLY-013]
owns_paths:
  - apps/web/src/lib/auth.ts
  - apps/web/src/lib/auth-client.ts
  - apps/web/src/app/api/auth/**
  - apps/web/src/app/[locale]/(auth)/**
  - apps/web/src/middleware.ts
  - apps/web/src/proxy.ts
  - messages/pl/auth.json
  - messages/en/auth.json
  - packages/db/src/schema/**
  - packages/db/migrations/**
  - docs/progress/FLY-014.md
  - docs/backlog/FLY-014-better-auth.md
  - docs/BACKLOG.md
  - .env.example
estimate: M
---

## Goal

A person can create an account with email and password, sign in, sign out, and register a
passkey. Google and magic link work when their credentials are present and are hidden when
they are not.

## Context

[ADR 0005](../adr/0005-better-auth.md) is the decision. FLY-012 created the Drizzle auth
tables. FLY-013 created `(auth)` / `(app)` layouts and i18n.

`better-auth` 1.7.2, Argon2id, database sessions (no JWT-as-session). Secret:
`BETTER_AUTH_SECRET`. Base URL: `BETTER_AUTH_URL`.

If this task approaches 800 changed lines, **stop after email/password + session gating** and
open a follow-up task for passkeys / Google / magic link. Do not silently ship a 2000-line PR.

Middleware / `proxy.ts`: unauthenticated users can reach `(auth)` and `/api/health` and
`/api/auth/*`. `(app)` requires a session. Next.js 16 may use `proxy.ts` instead of
`middleware.ts` – follow the Better Auth + Next 16 docs current on the day you implement, not
training data.

Google: authorised redirect URIs are already documented in `OWNER_SETUP.md`. Hide the button
when env vars are empty.

Magic link: hide when SMTP env is empty. Do not log magic-link URLs.

Passkeys: always on. Touch targets ≥ 44 px.

Do not implement GDPR export or account deletion (Phase 8).

## Acceptance criteria

- [ ] Sign up with email/password; password hashed with Argon2id (Better Auth default; do not
      replace with bcrypt).
- [ ] Sign in / sign out. Session is database-backed.
- [ ] Passkey registration and sign-in work on a platform authenticator (Windows Hello is
      enough for the implementer to verify locally).
- [ ] Google button visible only when `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- [ ] Magic-link form visible only when SMTP is configured.
- [ ] `(app)` routes redirect to sign-in when there is no session.
- [ ] All copy in `messages/pl/auth.json` and `messages/en/auth.json`. No U+2014.
- [ ] Pages usable at 375 px. Controls ≥ 44 px.
- [ ] `.env.example` lists every auth-related key this task reads, none of the values.
- [ ] `pnpm verify` green.
- [ ] `docs/progress/FLY-014.md` written. Record which methods you actually exercised.

## Test plan

- Unit/integration: the auth config exports the four methods with the env gates above.
- Manual (owner will also run the Phase 1 pilot checklist): email/password round trip.
- Passkey: at least one successful registration on the implementer's machine, or an explicit
  note in the progress file if the environment cannot do WebAuthn (CI cannot).
- Do not call Google from CI.

## Out of scope

- First-run safety acknowledgement (FLY-019).
- Theme / night mode (FLY-015).
- PWA (FLY-016).
- Account deletion, data export, linked-account management UI beyond "this is how you signed
  in".
- Changing the Better Auth table shapes except to add a plugin table the library requires
  (e.g. `passkey`). If you must migrate, name it `NNNN_fly014_*.sql`.

## References

ADR 0005 · `docs/ARCHITECTURE.md` §8 · `docs/OWNER_SETUP.md` §2 · `docs/SAFETY.md` §1.1
(read it, but do not implement it here) · Better Auth Next.js + Drizzle docs (current)
