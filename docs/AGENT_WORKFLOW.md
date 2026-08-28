# AGENT_WORKFLOW.md

How AI agents are organised on this project. [`AGENTS.md`](../AGENTS.md) is what an agent reads to
do the work; this file is how the work is arranged around them.

---

## 1. Roles

A role is a mode of operation, not a person. One session takes one role at a time.

| Role | Does | May edit | Cannot |
|---|---|---|---|
| **Architect** | Breaks a phase into tasks, writes ADRs, maintains the backlog | `docs/**` | Write implementation code |
| **Implementer** | Executes one task: code, tests, PR | Only the task's `owns_paths` | Review its own PR; touch other paths |
| **Reviewer** | Reviews a PR against the checklist | Nothing – comments only | Review a PR it authored |
| **Aviation validator** | Checks formulas against `DOMAIN.md` and primary sources; audits golden vectors | Comments; `DOMAIN.md` corrections | – |
| **Doc keeper** | Writes `docs/progress/`, updates statuses, maintains the glossary | `docs/**` | Change code or tests |

The separation that matters most is **Implementer ≠ Reviewer**. An agent that has spent a session
convincing itself a formula is right is the worst possible reviewer of that formula. With one agent
at a time, the separation is temporal rather than parallel: **the incoming agent reviews the open PR
left by its predecessor, as its first act.** See §5.

The **Aviation validator** can block a merge on formula grounds alone, even when every test passes.
Tests prove the code matches the specification; the validator checks the specification.

---

## 2. The task lifecycle

```
Architect writes docs/backlog/FLY-XXX-slug.md
        │
        ▼
Agent N   ─ picks up: git log / status / branch -a / gh pr list
          ─ REVIEWS the open PR left by agent N-1        ──▶ approve or request changes
          ─ reads docs/progress/ for recent tasks
          ─ reads task file + referenced docs
          ─ status: in-progress
          ─ branch: <type>/FLY-XXX-slug  (or resumes an existing one)
          ─ writes tests first for numeric behaviour
          ─ implements, staying inside owns_paths
          ─ pnpm verify
          ─ lands before empty: commit, push, docs/progress/FLY-XXX.md
          ─ gh pr create ─ status: in-review
        │
        ▼
Agent N+1 ─ reviews that PR as its first act ──▶ back to the loop
        │
        ▼
Aviation validator pass (formula changes only) ─ approve or block
        │
        ▼
Owner merges (squash) ──▶ status: done
```

A task may span several agents. Each one leaves a session entry in `docs/progress/FLY-XXX.md`, and
the branch carries work-in-progress commits that are never rebased away.

## 3. Task file format

`docs/backlog/FLY-XXX-slug.md`:

```yaml
---
id: FLY-042
title: Wind triangle solver
status: todo              # todo | in-progress | in-review | done | blocked
phase: 3
depends_on: [FLY-038]
owns_paths:
  - packages/aviation/src/navigation/**
  - packages/aviation/test/vectors/navigation.json
estimate: M               # S = under a session | M = about a session | L = split it
---

## Goal
One sentence. What is true after this task that was not true before.

## Context
What already exists, where, and what this builds on. Assume the reader has never seen this
repository.

## Acceptance criteria
- [ ] Checkable statements, ideally by running something.

## Test plan
Named files and what they cover. For numeric work, list the golden vectors required.

## Out of scope
What NOT to touch. This section prevents scope creep more effectively than any process.

## References
docs/DOMAIN.md §6.2 · POH section · ICAO Doc 4444 App. 2 · related task ids
```

**A task must be executable by an agent that has seen no prior conversation.** If it is not
self-contained, it is not ready.

**`estimate: L` is a planning defect.** Split it. A task that outgrows one session loses context
partway through, and that is where subtly wrong code comes from.

## 4. One agent at a time

Full protocol in [`HANDOFF.md`](HANDOFF.md). The essentials:

- **One agent, one working directory**, one `dev` branch of the database. No worktrees.
- **Keep a context reserve.** Around 20 % remaining: take on no new work. Around 10 %: commit, push,
  write the handoff note, stop.
- **Write `docs/progress/FLY-XXX.md` every session**, not only when a task completes. A task may
  span three agents; the file gets three entries.
- **The incoming agent reviews the outgoing agent's PR** before starting anything of its own.
- **An unfinished branch stays.** Work-in-progress commits are a record of the route taken. Do not
  rebase them away to make history tidy.

**Contract-first still applies, but across time.** When one piece of work
depends on an interface another will implement, land the TypeScript interfaces alone in a short
task first. The next agent then builds against something committed rather than against its own
reconstruction of what was probably intended.

## 5. Sub-agents

Worth spawning:
- Broad codebase search – "find every use of `Knots`" – where only the conclusion is needed.
- Reviewing a PR in a context that has not been shaped by writing it.
- Extracting golden vectors from a source document.

Not worth spawning:
- Anything touching files another agent has open.
- Work needing continuity of design judgement across steps.

**At most three in parallel**, and only on disjoint paths. Note that sub-agents spend your context
budget too - a broad search costs less than reading the files yourself, but it is not free, and
running dry mid-task is the failure this workflow is built to avoid.

## 6. Context discipline

Agents lose accuracy as context fills. Countermeasures built into the process:

- Tasks are sized to one session.
- Task files are self-contained, so nothing depends on remembering earlier conversation.
- `DOMAIN.md` is the external memory for formulas – an agent looks things up rather than recalling
  them.
- `docs/progress/FLY-XXX.md` records decisions at the end of each task, so the next agent inherits
  reasoning rather than reconstructing it.
- Golden vectors are permanent, machine-checked memory. They outlive every session.

## 7. What an agent must never do

1. **Invent a formula, constant or default.** The commonest and most dangerous failure. A plausible
   number is worse than a visible gap.
2. **Adjust a golden vector to make a test pass.** If vector and code disagree, a human decides.
3. **Touch paths outside `owns_paths`.**
4. **Expand scope silently.** Discovering the task is wrong is useful information – report it.
5. **Add a dependency without an ADR.**
6. **Merge its own work.**

## 8. Escalation

Report rather than guess when:

| Situation | Action |
|---|---|
| Formula missing from `DOMAIN.md` | Add it with a citation, flag for validator review; do not implement first |
| Value unknown | `// TODO(FLY-XXX)` + entry in `DECISIONS_PENDING.md` + note it in the PR |
| Need a path you do not own | Stop. Report. Wait |
| Vector disagrees with implementation | Leave the test failing. Escalate |
| External API behaves unexpectedly | Update `DATA_SOURCES.md` with what you observed; escalate before adapting |
| Task larger than a session | Stop. Propose a split |
| Safety mechanism affected | `safety` label, issue before fix, reproducing vector first |

One escalation message costs a minute. A wrong number can reach a kneeboard.

## 9. Progress record

Every completed task writes `docs/progress/FLY-XXX.md`:

```markdown
# FLY-042 – Wind triangle solver

**Session 2 · completed:** 2026-09-14 · **PR:** #37

## Done
Solver in `packages/aviation/src/navigation/windTriangle.ts`. 14 golden vectors covering all four
wind quadrants, zero wind, pure head/tailwind and the no-solution case. Property tests for the
invariants in DOMAIN.md §6.4.

## Decisions
WCA sign convention: positive to the right of track. Documented in DOMAIN.md §6.1 – everything
downstream depends on this.

## Open
Magnetic declination still hardcoded at 6°E in the integration test. Unblocked by FLY-045.

## Notes for whoever comes next
`GS` can go negative when wind exceeds TAS on a reciprocal track. Currently returns a no-solution
result; if that ever needs to change, the OFP leg table assumes GS > 0.
```

One file per task, never a shared log. The "notes for whoever comes next" section is the most
valuable part of this entire process: with sequential agents it is the only channel through which
hard-won context survives the end of a session.
