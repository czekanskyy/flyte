# Architecture Decision Records

One file per decision that would be expensive to reverse. Numbered, immutable once accepted – a
decision that changes gets a **new** ADR that supersedes the old one, so the reasoning at the time
survives.

## Format

```markdown
# ADR NNNN – Title

**Status:** Proposed | Accepted | Superseded by ADR-MMMM · **Date:** YYYY-MM-DD

## Context
The situation and the forces at play. What did we actually check?

## Decision
What we are doing. Present tense, active voice.

## Consequences
What this buys, what it costs, what it now constrains.
```

## When to write one

- Adding or replacing a dependency.
- Choosing between two viable architectural approaches.
- Deliberately **not** using the obvious or newest option.
- Any decision an agent might otherwise "helpfully" undo six weeks from now.

That last case is the main reason this directory exists. Pinning TypeScript one major behind
`latest` looks like neglect unless the reasoning is written down where the next agent will find it.

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-stack-and-version-pins.md) | Stack and version pins | Accepted |
| [0002](0002-typescript-version.md) | Pin TypeScript to 6.0.3, not 7.x | Accepted |
| [0003](0003-package-manager.md) | Package manager: pnpm, not bun | Accepted |
| [0004](0004-neon-postgis.md) | Neon Postgres with PostGIS as the single datastore | Accepted |
| [0005](0005-better-auth.md) | Better Auth, self-hosted, over Auth.js and Neon Managed Better Auth | Accepted |
| 0006 | MapLibre GL over Leaflet | Planned (Phase 5) |
| 0007 | Ports and adapters for external data sources | Planned (Phase 4) |
| [0008](0008-si-branded-units.md) | SI internally, branded unit types | Accepted |
| 0009 | Attribution policy | Planned (credits page, Phase 1 FLY-019) |
| 0010 | One agent at a time, with a handoff protocol | Planned (already practised; write-up later) |
| 0011 | Implement WMM 2025 in-house | Planned (Phase 3) |
| 0012 | NOTAM source | Blocked on FLY-002 |
| [0013](0013-shadcn-ui.md) | shadcn/ui copy-in kit in `packages/ui` | Accepted |
| [0014](0014-glassmorphism.md) | Glassmorphism as the application visual language | Accepted |

## Evaluated and rejected, pending a full ADR

**Neon Managed Better Auth** (checked 2026-08-28). Neon now offers Better Auth as a managed service
with per-branch auth environments, which looked convenient. Rejected
because its supported plugin set is Admin, Email OTP, JWT, Magic Link, Organization (partial),
Open API and Phone Number – **passkeys are absent and not on the published roadmap**. Passkeys are
the specific reason Better Auth was chosen over Auth.js in the first place, and the specific reason
they matter here is that this application is operated outdoors, in gloves, in sunlight.

It is also beta, targeting GA "this quarter", with pricing not yet published, and it would tie the
auth layer to Neon – against the reasoning in ADR 0004, which treats Neon as ordinary Postgres.

Self-hosted Better Auth loses nothing by comparison: the auth tables live in the branch database
either way, so branch isolation comes free from Neon branching without the managed layer.

Revisit if passkey support ships and reaches GA.
