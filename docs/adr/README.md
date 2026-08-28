# Architecture Decision Records

One file per decision that would be expensive to reverse. Numbered, immutable once accepted — a
decision that changes gets a **new** ADR that supersedes the old one, so the reasoning at the time
survives.

## Format

```markdown
# ADR NNNN — Title

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
| 0003 | Package manager: pnpm, not bun | Planned |
| 0004 | Neon Postgres with PostGIS as the single datastore | Planned |
| 0005 | Better Auth over Auth.js | Planned |
| 0006 | MapLibre GL over Leaflet | Planned |
| 0007 | Ports and adapters for external data sources | Planned |
| 0008 | SI internally, branded unit types | Planned |
| 0009 | Attribution policy | Planned |
| 0010 | Two parallel agent lanes | Planned |
| 0011 | Implement WMM 2025 in-house | Planned |
| 0012 | NOTAM source | Blocked on FLY-002 |
