# OWNER_SETUP.md

External accounts and credentials that only the project owner can obtain. Agents cannot create
these; Phase 1 is blocked until they exist.

This is the reference: what each credential is, where it comes from, and what it unblocks. The
step-by-step walkthrough is a separate working document.

---

## Summary

| # | Service | Provides | Blocks | Self-service |
|---|---|---|---|---|
| 1 | **Neon** | `DATABASE_URL` + one branch per agent lane | All of Phase 1 | Yes |
| 2 | **Google Cloud** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in only | Yes |
| 3 | **Cloudflare** | Tunnel token, DNS for `flyte.czekanski.dev` | Deployment only | Yes |
| 4 | **FAA** | `FAA_CLIENT_ID`, `FAA_CLIENT_SECRET` | FLY-002 / NOTAM only | **No – by request, may be refused** |

Only **Neon** blocks the whole phase. The rest block one feature each, and Phase 1 work can begin
without them.

---

## 1. Neon – the only hard blocker

Three branches are needed, not one:

| Branch | Purpose |
|---|---|
| `main` | Production. Never developed against directly |
| `lane-a` | Agent lane A |
| `lane-b` | Agent lane B |

Per-lane branches are what make the parallel workflow safe: one agent running a migration cannot
disturb the other's running application. Branches are created from `main` and can be reset from it
at any phase sync point. See [`LANES.md`](LANES.md).

Region: choose an EU region (Frankfurt is closest to Poland) for latency and for keeping personal
data inside the EU.

Each lane's `.env.local` gets its own branch connection string:

```bash
DATABASE_URL=postgresql://...@ep-....eu-central-1.aws.neon.tech/flyte?sslmode=require
```

PostGIS is enabled once per branch with `CREATE EXTENSION IF NOT EXISTS postgis;` – this is part of
the first migration, not a manual step.

## 2. Google Cloud – OAuth client

Needed only for the "Sign in with Google" method. Email/password, magic link and passkeys work
without it.

Authorised redirect URIs – **both** are required:

```
http://localhost:3000/api/auth/callback/google
https://flyte.czekanski.dev/api/auth/callback/google
```

Google requires HTTPS for redirect URIs, with `localhost` as the documented exception, so the
development URI stays on plain HTTP.

While the consent screen is in "Testing" status, only accounts listed as test users can sign in.
That is sufficient for the whole build; publishing is a Phase 8 concern.

Scopes: `openid`, `email`, `profile`. Nothing more – Flyte reads no Google data.

## 3. Cloudflare – tunnel and DNS

Requires `czekanski.dev` to be using Cloudflare nameservers.

A Cloudflare Tunnel is used instead of port forwarding because the host is a home server: no
inbound ports are opened, it works behind CGNAT and a changing IP address, and TLS terminates at
Cloudflare.

The tunnel token is pasted into the `cloudflared` app on TrueNAS. Public hostname mapping:

| Field | Value |
|---|---|
| Subdomain | `flyte` |
| Domain | `czekanski.dev` |
| Service type | `HTTP` |
| URL | `flyte-web:3000` |

The service is plain HTTP because the connection between `cloudflared` and the container is
internal to the Docker network. Public HTTPS is handled by Cloudflare.

DNS is created automatically when the public hostname is added.

## 4. FAA – NOTAM API access

> **Not self-service, and likely to be refused.** The FAA API portal does not issue NOTAM
> credentials on signup. Access is requested by email to `NOTAMS@faa.gov`, and operator eligibility
> is restricted. A private, non-commercial project outside US airspace is not an obvious candidate
> for approval.

Send the request, then proceed as though the answer is no. A refusal is a **complete** outcome for
[FLY-002](backlog/FLY-002-notam-coverage-spike.md), not a failure: it settles the question and the
documented fallback takes over.

The fallback – link out to PANSA IWB, plus a paste-your-own-NOTAM field parsed into the OFP, plus a
"NOTAMs checked" confirmation with a timestamp – makes no claim the data cannot support. PANSA AIS
is the official source for Polish NOTAMs regardless of what the FAA would have provided.

---

## Where each connection string goes

Three branches means three connection strings, and they do **not** all live in the same place.

| Branch | Destination | When |
|---|---|---|
| `lane-a` | `C:\Users\Dominik\Dev\flyte\.env.local` | Now |
| `lane-b` | `C:\Users\Dominik\Dev\flyte-lane-b\.env.local` | Phase 1, once the worktree exists |
| `main` | Password manager, then a GitHub Actions secret and the TrueNAS app | Phase 1 deployment |

The two lanes work in separate git worktrees, so each has its own working directory and therefore
its own `.env.local`. Nothing needs switching between them and nothing collides: each agent reads
the file sitting next to the code it is editing.

Until the lane B worktree exists there is nowhere to put its string, so keep it in a password
manager alongside the production one. A text file on the desktop is not a holding place for a
credential granting write access to a database.

### Production never lives on the development machine

A deliberate safety boundary, not tidiness.

Agents run migrations. `pnpm db:migrate` reads `DATABASE_URL` from whichever `.env.local` sits in
its working directory. If the production string were ever in one of those files, a mistyped command,
a stale shell, or an agent working from the wrong directory could run a migration against real data.

So the `main` connection string goes to the deployment pipeline only:

```bash
gh secret set DATABASE_URL --repo czekanskyy/flyte
```

`gh secret set` prompts for the value and sends it straight to GitHub. It is not echoed, not written
to shell history, and not visible to anyone reading the session.

Neon branches can be reset from `main` at any phase sync point, so a lane branch is disposable by
design. Production is not, and the two should never be reachable from the same file.

## Handling the credentials

- Values go into `.env.local`, which is git-ignored. **Never commit them, and never paste them into
  a chat, an issue or a pull request.**
- If a secret is committed by accident, rotate it at the provider. Removing the commit is not
  enough; assume anything pushed to a public repository is compromised.
- Deployment secrets go in GitHub repository secrets, not in the repository.
- Rotation schedule is in [`MAINTENANCE.md`](MAINTENANCE.md).

## Not yet needed

| Credential | Needed by |
|---|---|
| `OPENAIP_CLIENT_ID` | Phase 4 (aeronautical data import) |
| SMTP credentials | Phase 1, magic-link sign-in only |
| `REDIS_URL` | Phase 6 (weather caching); local Docker until then |

`aviationweather.gov`, Open-Meteo and Overpass need no credentials at all.
