# OWNER_SETUP.md

External accounts and credentials that only the project owner can obtain. Agents cannot create
these; Phase 1 is blocked until they exist.

This is the reference: what each credential is, where it comes from, and what it unblocks. The
step-by-step walkthrough is a separate working document.

---

## Summary

| # | Service | Provides | Blocks | Self-service |
|---|---|---|---|---|
| 1 | **Neon** | `DATABASE_URL` for a `dev` branch | All of Phase 1 | Yes |
| 2 | **Google Cloud** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in only | Yes |
| 3 | **Cloudflare** | Tunnel token, DNS for `flyte.czekanski.dev` | Deployment only | Yes |
| 4 | **FAA** | `FAA_CLIENT_ID`, `FAA_CLIENT_SECRET` | FLY-002 / NOTAM only | **No – by request, may be refused** |

Only **Neon** blocks the whole phase. The rest block one feature each, and Phase 1 work can begin
without them.

---

## 1. Neon – the only hard blocker

Two branches, not one:

| Branch | Purpose |
|---|---|
| `main` | Production. Never developed against, never in a local environment file |
| `dev` | The working branch. This is what `DATABASE_URL` points at locally |

The separation exists because agents run migrations, and `pnpm db:migrate` applies them to whatever
`DATABASE_URL` it finds. Keeping production out of every local environment file is what stops a
mistyped command reaching real data. `dev` is resettable from `main` at any phase sync point, so it
stays disposable by design.

Region: choose an EU region (Frankfurt is closest to Poland) for latency and for keeping personal
data inside the EU.

The `dev` connection string goes in `.env.local`:

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

### After GHCR has a `flyte-web` image

Actions on `main` build and push `ghcr.io/czekanskyy/flyte-web` (tagged `sha-<commit>` and `latest`).
They do **not** deploy to TrueNAS. The NAS pulls.

1. On the NAS, copy `docker-compose.prod.yml` (and `docker/pdf-stub` if you still build the
   PDF stub locally). Point Compose at a host env file that holds `DATABASE_URL` for the
   Neon **main** branch, `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL=https://flyte.czekanski.dev`.
   That env file never lives in git and never on the development machine.
2. `docker compose -f docker-compose.prod.yml pull flyte-web`
3. `docker compose -f docker-compose.prod.yml up -d flyte-web flyte-redis flyte-pdf`
4. Optional tunnel profile: set `CLOUDFLARE_TUNNEL_TOKEN` and
   `docker compose -f docker-compose.prod.yml --profile tunnel up -d`
5. Confirm `http://flyte-web:3000/api/health` from the Docker network, then the public
   hostname mapping in §3.

Re-pull after each merge to `main`. The AIRAC worker container is Phase 4.

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

Two branches means two connection strings, and they do **not** go to the same place.

| Branch | Destination | When |
|---|---|---|
| `dev` | `C:\Users\Dominik\Dev\flyte\.env.local` | Now |
| `main` | Password manager, then a GitHub Actions secret and the TrueNAS app | Phase 1 deployment |

### Production never lives on the development machine

A deliberate safety boundary, not tidiness.

Agents run migrations. `pnpm db:migrate` reads `DATABASE_URL` from `.env.local` and applies whatever
is pending. If the production string were ever in that file, a mistyped command or a stale shell
would be one step away from migrating real data. With a single agent there is also nobody working
in a second environment who might notice something going somewhere unexpected.

So the `main` connection string goes to the deployment pipeline only:

```bash
gh secret set DATABASE_URL --repo czekanskyy/flyte
```

`gh secret set` prompts for the value and sends it straight to GitHub. It is not echoed, not written
to shell history, and not visible to anyone reading the session.

`dev` can be reset from `main` at any phase sync point, so it is disposable by design. Production is
not, and the two should never be reachable from the same file.

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
