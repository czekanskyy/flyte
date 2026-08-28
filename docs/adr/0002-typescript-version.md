# ADR 0002 — Pin TypeScript to 6.0.3, not 7.x

**Status:** Accepted · **Date:** 2026-08-28 · **Supersedes:** — · **Superseded by:** —

## Context

TypeScript 7.0 shipped stable on 2026-07-08 — the compiler rewritten in Go, roughly ten times
faster on full builds. `npm view typescript version` returns **7.0.2**, and `latest` points at it.
For a monorepo whose CI runs `typecheck` on every pull request, that is a real, recurring saving.

However, TypeScript 7.0 ships **without a stable programmatic API**; the team expects it in 7.1.
Tools that consume the compiler API therefore cannot yet support it. Checked directly:

```
npm view typescript-eslint@8.68.0 peerDependencies
→ { "eslint": "^8.57.0 || ^9.0.0 || ^10.0.0",
    "typescript": ">=4.8.4 <6.1.0" }
```

`typescript-eslint` explicitly excludes 6.1 and above.

This matters more here than it would in most projects. `packages/aviation` is the safety-critical
calculation core, and its defining property is that it contains no React, no I/O and no network
access — which is what allows its entire hand-verified test suite to run in under a second. That
boundary is enforced mechanically by `eslint-plugin-boundaries`, which needs type information, which
comes from `typescript-eslint`.

Dropping `typescript-eslint` would mean the boundary is enforced by nothing but the discipline of
whoever is writing code that day. With AI agents doing most of the implementation, in parallel,
across sessions that do not share memory, that is not a control at all.

Microsoft publishes `@typescript/typescript6`, a compatibility package exposing a `tsc6` binary and
re-exporting the 6.0 API so existing tooling keeps working alongside 7.x.

## Decision

**Pin `typescript` to `6.0.3` in the workspace catalog.**

6.0.3 is the newest release inside `typescript-eslint`'s supported range.

The compatibility-package hybrid — 7.x for builds, `tsc6` for lint — was considered and rejected for
now: it means two compilers, two sets of diagnostics, and a class of "passes lint, fails build"
confusion that would land on agents who cannot ask a follow-up question. The build-time saving does
not justify that on a project of this size.

## Consequences

**Accepted:** slower type checking than 7.x would give. On a codebase this size, seconds per CI run.

**Gained:** `eslint-plugin-boundaries` keeps working, so the architectural boundary that makes the
safety-critical package testable is enforced by CI rather than by hope.

**Guarded:** the catalog pin is exact, not a range. An agent cannot drift onto 7.x by running
`pnpm update`, and CI fails if the installed version leaves the supported range.

## Exit condition

Revisit when **`typescript-eslint` declares support for TypeScript 7** — expected once the stable
programmatic API lands in 7.1.

Migration then is: bump the catalog pin, bump `typescript-eslint`, run `pnpm verify`, and fix
whatever the new compiler is stricter about. Small, and worth doing promptly for the build speed.

Until then, this ADR is the answer to "why are we not on the latest TypeScript?" — the question will
recur, and the answer is not "nobody got round to it".
