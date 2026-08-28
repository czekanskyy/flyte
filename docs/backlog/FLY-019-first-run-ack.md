---
id: FLY-019
title: "First-run acknowledgement, credits stub, app chrome"
status: todo
phase: 1
depends_on: [FLY-014, FLY-015]
owns_paths:
  - apps/web/src/app/[locale]/(app)/**
  - apps/web/src/app/[locale]/credits/**
  - messages/pl/safety.json
  - messages/en/safety.json
  - messages/pl/credits.json
  - messages/en/credits.json
  - packages/db/src/schema/**
  - packages/db/migrations/**
  - docs/progress/FLY-019.md
  - docs/backlog/FLY-019-first-run-ack.md
  - docs/BACKLOG.md
  - docs/adr/0009-attribution-policy.md
estimate: S
---

## Goal

Before any planning placeholder is usable, the signed-in user must accept the safety statement
in [`docs/SAFETY.md`](../SAFETY.md) §1.1. Acceptance is stored per user with a timestamp and
the text version. `/credits` exists inside the authenticated app. A persistent shell (nav)
holds theme + language controls already shipped.

## Context

This is a **safety requirement**, not decoration. Mapping: SAFETY.md §9 "First-run
acknowledgement gates planning" → E2E (full e2e suite is later; this task still needs an
automated test, component or Playwright, that the gate works).

Exact wording – do not paraphrase:

**PL** – „Flyte nie jest zatwierdzonym źródłem danych lotniczych. Nie zastępuje AIP, NOTAM ani
oficjalnej odprawy przedlotowej. Odpowiedzialność za przygotowanie i wykonanie lotu ponosi
dowódca statku powietrznego."

**EN** – "Flyte is not an approved source of aeronautical data. It does not replace AIP, NOTAM or
an official pre-flight briefing. Responsibility for the preparation and conduct of the flight
rests with the pilot in command."

Store `acknowledgement_version` (e.g. `"safety-1.1"`) and `acknowledged_at` on the user (or a
1:1 table). Re-show when the version string changes.

Logbook and E6B are exempt once they exist. In Phase 1 they do not. Gate a `/plan`
placeholder (or the future map/OFP routes). Home after login can explain what Flyte is
without being a planning tool.

`/credits`: default of D-004 is *inside the authenticated app*. Write a short ADR 0009 that
records the attribution policy already decided in `DATA_SOURCES.md` §10 (no attribution on
printouts; in-app only where OpenAIP is consumed; `/credits` carries the full legal detail).
Phase 1 `/credits` can say OpenAIP is not consumed yet and still list the other sources at a
stub level, plus a link to PANSA AIS.

## Acceptance criteria

- [ ] Unsigned-in users never see planning. Signed-in users who have not accepted see the
      acknowledgement, not `/plan`.
- [ ] Accepting records version + timestamp. Changing the version in code re-prompts.
- [ ] The on-screen text matches SAFETY.md §1.1 in both languages (character for character
      aside from surrounding UI chrome).
- [ ] A test fails if `/plan` (or the gated route) is reachable without acknowledgement.
- [ ] `/credits` is reachable when signed in. No OpenAIP data is shown as if it were loaded.
- [ ] ADR 0009 written; `docs/adr/README.md` updated.
- [ ] Shell nav: link to home, placeholder plan (gated), credits, theme + language controls
      from FLY-013/015. Touch targets ≥ 44 px. 375 px usable.
- [ ] Migration `NNNN_fly019_*.sql` if the schema changes.
- [ ] `pnpm verify` green.
- [ ] `docs/progress/FLY-019.md` written.

## Test plan

- Component or integration: user without ack cannot render the planning placeholder;
  after ack, they can.
- i18n: both files contain the SAFETY.md sentences.

## Out of scope

- Real map / OFP / FPL.
- Print templates (and therefore print attribution, which must remain absent).
- Making `/credits` public (D-004 default is authenticated; do not flip it).
- GDPR export / account deletion.

## References

`docs/SAFETY.md` §1.1, §9 · `docs/DATA_SOURCES.md` §10 · `docs/DECISIONS_PENDING.md` D-004 ·
`docs/PRD.md` §7 (no attribution on printouts)
