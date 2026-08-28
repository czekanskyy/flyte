# HANDOFF.md

**One agent works this repository at a time.** When it exhausts its token budget, another takes
over from where it stopped.

That makes context handoff the central discipline of this project. Not conflict avoidance: there is
nobody to conflict with. The risk is different and quieter. An agent stops mid-task, and the next
one picks up a branch it has never seen, with half a feature in it, no record of what was tried, and
no idea which of the two plausible approaches the previous agent had already rejected and why.

Everything below exists to make that moment survivable.

---

## 1. Reserve budget: stop before you are empty

An agent that runs out of context mid-sentence leaves nothing behind. The work is on a branch, but
the reasoning is gone, and the next agent has to reconstruct it from a diff.

So treat context like fuel, and plan a reserve you do not spend:

| State | Roughly | What you do |
|---|---|---|
| **En route** | Plenty remaining | Normal work. Take on the next step of the task |
| **Reserve** | Around 20 % remaining | **Take on no new work.** Finish the step in hand, then land |
| **Landing** | Around 10 % remaining | Commit, push, write the handoff note, update status. Nothing else |

Crossing into reserve is not a suggestion. Finishing one more function and running dry is worse than
stopping one function early with a clean note, because the next agent then pays for both the
unfinished function and the missing explanation.

**Landing checklist**, in this order, because each step is useless without the ones before it:

1. `git add -A && git commit` – a work-in-progress commit on a task branch is fine and expected.
   Say so in the message: `wip(aviation): density altitude, vectors not yet written`.
2. `git push` – unpushed work does not exist as far as the next agent is concerned.
3. Write `docs/progress/FLY-XXX.md`. **This is the step that matters most.** Section 3 below.
4. Set `status:` in the task file to `in-progress` (still yours to finish) or `in-review` (done, PR
   open).
5. If a PR is open, say in a PR comment exactly where you stopped.

## 2. Picking up

You are probably not the first agent on this task. Before writing any code:

1. `git log --oneline -15` and `git status` – what is here, and is the working tree clean?
2. `git branch -a` – is there an unfinished task branch? Check it out rather than starting a new one.
3. Read `docs/progress/` for the task id in the branch name, and for the two or three tasks before
   it. The "notes for whoever comes next" sections are written for you specifically.
4. Read the task file in `docs/backlog/`. Check its `status:`.
5. `gh pr list` – is there an open PR waiting? See section 4.
6. `pnpm verify` – establish whether you are starting from a green state or inheriting a failure.
   Knowing which is worth the minute it costs.

Only then start work.

**If the inherited state is confusing, say so before building on it.** An agent that quietly guesses
what its predecessor intended, and guesses wrong, produces work that looks finished and is not. That
is the specific failure this whole document is trying to prevent.

## 3. The handoff note

`docs/progress/FLY-XXX.md`, one file per task. Never a shared log.

Written **at the end of every session**, not only at the end of a task. If two agents work on
FLY-042, the file gets two entries.

```markdown
# FLY-042 – Wind triangle solver

## Session 2 · 2026-09-14 · stopped in reserve

**State:** in-progress. Branch `feat/FLY-042-wind-triangle`, pushed, 3 commits.

**Done:** `windTriangle.ts` solves for WCA, TH and GS. 9 of the 14 planned golden vectors are in
and passing.

**Not done:** the no-solution case (wind exceeding TAS across track) returns `NaN` instead of an
explicit result. Vectors 10 to 14 are written in the task file but not yet added.

**Decisions made, do not re-litigate:**
- WCA is positive to the right of track. Documented in DOMAIN.md §6.1. Everything downstream
  assumes it.
- Tried `Math.asin` clamping to handle the no-solution case; it silently returns a wrong angle
  rather than failing. Rejected. Use an explicit discriminated union instead.

**Next concrete step:** change the return type to `WindTriangleResult | NoSolution` in
`windTriangle.ts:34`, then add vectors 10 to 14.

**Watch out:** `signedDelta` in `geo/angles.ts` returns `(-180, 180]`, not `[-180, 180)`. Exactly
180 is positive. It cost me twenty minutes.
```

The last two sections are the ones that pay for themselves. **Rejected approaches** are the most
expensive thing to rediscover, because the next agent will find the same appealing shortcut and try
it. **Watch out** is where you spend your surprise so nobody else has to.

Write it in a way that assumes the reader has no memory of this conversation, because they do not.

## 4. Review: the incoming agent reviews the outgoing agent's PR

With one agent at a time, there is no second reviewer available. Reviewing your own work is not an
option either: an agent that has just spent a session persuading itself a formula is right is the
worst available reviewer of that formula.

The answer falls out of the handoff itself. **The first act of an incoming agent is to review the
open PR left by its predecessor.**

This is not a workaround. It is better than what it replaces:

- The reviewer has genuinely fresh context. It cannot pattern-match past a mistake it made itself.
- Reviewing is how the new agent learns what it has inherited. Onboarding and review are the same
  reading.
- It happens automatically, in the right order, with no scheduling.

Review against the checklist in [`CONTRIBUTING.md`](CONTRIBUTING.md), and against
[`DOMAIN.md`](DOMAIN.md) rather than intuition. Then either request changes, or approve and let the
owner merge.

**If you find a defect in the work you are inheriting, say so plainly.** There is no colleague to
offend, and the alternative is building on it.

## 5. Rules that survive the change, for different reasons

Several conventions in this repository were originally introduced to keep two concurrent agents out
of each other's files. They all stay, because each turns out to be worth more for handoff than it
ever was for conflict avoidance.

| Convention | Now justified by |
|---|---|
| One progress file per task | It is the handoff mechanism itself |
| Task files self-contained | The reader has no memory of the conversation that produced them |
| `owns_paths` in every task | Scope control. It stops a low-budget agent wandering into a refactor it cannot finish |
| Schema split per domain | Smaller files, faster to read cold, cheaper in context |
| i18n messages split per module | Same |
| Migrations named `NNNN_flyXXX_*` | Provenance. You can see which task produced a migration without reading it |
| Generated `BACKLOG.md` | One command rebuilds the picture instead of trusting a hand-edited table |
| Contract-first interfaces | Sequencing: land the interface in one session, implement against it in the next |

## 6. Task sizing

`estimate: L` was a planning defect before. It is now a **direct cause of bad handoffs**: a task
that cannot fit in one budget guarantees a mid-task stop, and mid-task stops are where context is
lost.

- `S` – comfortably under one budget.
- `M` – about one budget. The normal size.
- `L` – **split it before starting.** Not "attempt it and see".

If you are handed an `L`, your task is to split it into `S` and `M` pieces and write those task
files. That is a complete and useful session.

## 7. Git

One agent, one working directory: `C:\Users\Dominik\Dev\flyte`. No worktrees.

Branches are named by change type and task id:

```
feat/FLY-042-wind-triangle
fix/FLY-051-night-totals-across-midnight
docs/FLY-060-domain-fuel-section
chore/FLY-033-catalog-bump
```

An unfinished branch stays. Do not delete it, do not squash it into something tidier, and do not
rebase away the work-in-progress commits. Those commits are a record of the route taken, and the
next agent may need to see where it turned.

## 8. Database

Two Neon branches, not one per agent:

| Branch | Purpose |
|---|---|
| `main` | Production. Never developed against, never in a local `.env.local` |
| `dev` | The single working branch. `DATABASE_URL` in `.env.local` points here |

`dev` can be reset from `main` at any phase sync point, so it stays disposable. Keeping production
out of every local environment file is the boundary that matters, and it matters more with a single
agent: there is nobody working in a second environment who might notice a migration going somewhere
unexpected.

## 9. Sync point at the end of a phase

1. All task branches merged to `main`, CI green.
2. Owner completes the phase's [`PILOT_VALIDATION.md`](PILOT_VALIDATION.md) checklist.
3. Dependency versions re-verified against the registry.
4. Architect writes the next phase's task files.
5. `pnpm backlog:sync`.
6. Reset `dev` from `main`.
