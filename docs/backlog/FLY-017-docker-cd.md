---
id: FLY-017
title: "Docker Compose and CD to GHCR"
status: in-review
phase: 1
depends_on: [FLY-013]
owns_paths:
  - Dockerfile
  - docker-compose.yml
  - docker-compose.prod.yml
  - .dockerignore
  - docker/pdf-stub/**
  - .github/workflows/cd.yml
  - apps/web/next.config.ts
  - apps/web/next.config.mjs
  - docs/progress/FLY-017.md
  - docs/backlog/FLY-017-docker-cd.md
  - docs/BACKLOG.md
  - docs/OWNER_SETUP.md
estimate: M
---

## Goal

`docker compose up` runs the web app locally against the same shape as production: `flyte-web`,
`flyte-redis`, and a `flyte-pdf` placeholder. A CD workflow builds the web image and pushes it
to GHCR. The owner can point a Cloudflare Tunnel at it; this task does not configure TrueNAS.

## Context

[`docs/ARCHITECTURE.md`](../ARCHITECTURE.md) §11:

```
GitHub Actions ──▶ GHCR ──▶ TrueNAS (Docker Compose) ──▶ Cloudflare Tunnel ──▶ flyte.czekanski.dev
```

Containers: `flyte-web` (Next.js standalone), `flyte-pdf` (Playwright/Chromium – **not
implemented in Phase 1**; ship a stub that healthchecks and returns 501 on PDF requests so
compose is already the right shape), `flyte-redis`, `cloudflared` (optional profile, token
from env).

Next.js `output: 'standalone'`. Multi-stage Dockerfile, non-root user, no secrets in the
image. `.dockerignore` excludes `.env.local`, `node_modules`, `.git`, docs noise.

CD: on push to `main` (and optionally tags), build and push `ghcr.io/czekanskyy/flyte-web`.
Do not deploy to TrueNAS from Actions – the NAS pulls. Document the pull/restart in
`OWNER_SETUP.md` as owner steps, not agent steps.

Cloudflare Tunnel mapping is already in `OWNER_SETUP.md` §3. Do not put the tunnel token in
the repo.

This task can land before FLY-014; the image does not need working auth to *build*. A
healthcheck hits `/api/health`.

## Acceptance criteria

- [ ] `Dockerfile` produces a Next.js standalone image. Runs as non-root.
- [ ] `docker-compose.yml` (dev) and a prod overlay or `docker-compose.prod.yml`: `flyte-web`,
      `flyte-redis`, `flyte-pdf` stub, optional `cloudflared`.
- [ ] `flyte-web` healthcheck: HTTP `/api/health`.
- [ ] `flyte-pdf` stub: listens, `/health` 200, PDF routes 501. Comment in compose that
      Playwright fills this in when print exists.
- [ ] `.github/workflows/cd.yml` pushes to GHCR. Uses GitHub's `GITHUB_TOKEN` and
      `packages: write`. Image tagged with sha and `latest` on `main`.
- [ ] No secrets in the image or in compose committed files. `DATABASE_URL` etc. come from
      env / a TrueNAS env file the owner maintains.
- [ ] `OWNER_SETUP.md` gains a short "after GHCR has an image" subsection: pull, compose up,
      tunnel already described.
- [ ] `pnpm verify` still green (Docker is extra; do not require Docker in `pnpm verify`).
- [ ] `docs/progress/FLY-017.md` written. Record whether you actually ran `docker compose up`
      locally.

## Test plan

- `docker compose build flyte-web` and `docker compose up -d flyte-web flyte-redis`.
  `curl` health. Tear down.
- CD workflow validates (`actionlint` not required). A dry-run on a branch is enough; pushing
  `latest` from a task branch is not.

## Out of scope

- Actually configuring Cloudflare Tunnel or TrueNAS (owner).
- Playwright PDF implementation.
- The AIRAC worker container (Phase 4).
- Putting `DATABASE_URL` for `main` anywhere except GitHub secrets / the NAS, and **never**
  in `.env.local`.

## References

`docs/ARCHITECTURE.md` §11 · `docs/OWNER_SETUP.md` §3 · `docs/HANDOFF.md` §8 · ADR 0001
