<!--
Title format: FLY-XXX – short description
One task per PR. Target under 400 changed lines; over 800 will be sent back to be split.
-->

## FLY-XXX – <title>

### What & why

<!-- What changed, and what problem it solves. The diff shows what; explain why. -->

### How to test

<!-- Exact steps and commands. Assume the reviewer has not seen the task. -->

```bash
pnpm verify
```

### Screenshots / PDF

<!-- Required for any UI change: desktop AND 375 px mobile.
     Required for any print template change: the rendered PDF. -->

---

### Aviation checklist

<!-- An unticked box is fine and informative. A ticked box that isn't true is a problem. -->

- [ ] Every formula used is documented in `docs/DOMAIN.md` with a cited source
- [ ] Golden vectors added, and their `source` names something outside this codebase
- [ ] No golden vector was modified to make a test pass
- [ ] Units are SI internally; conversion happens only at the UI boundary
- [ ] No `NaN`, no `Infinity`, no silent fallback – missing inputs return an explicit state
- [ ] Rounding is conservative for the pilot (altitude/fuel/time up, endurance down)
- [ ] Data freshness indicators respected where time-sensitive data is shown
- [ ] Attribution policy respected – in-app only where OpenAIP data is used, **never on printouts**
- [ ] Unverified aircraft data is visibly marked
- [ ] Works offline, where applicable
- [ ] Both `pl` and `en` translations added
- [ ] Tested at 375 px width; touch targets ≥ 44 px
- [ ] Only paths declared in the task's `owns_paths` were touched
- [ ] New dependencies have an ADR (and were added to the catalog by Lane A)

### Documentation

- [ ] `docs/progress/FLY-XXX.md` written
- [ ] `status:` updated in the task file
- [ ] Any of `DOMAIN.md` / `DATA_SOURCES.md` / `SAFETY.md` / `AGENTS.md` updated as needed
- [ ] Unknown values recorded in `docs/DECISIONS_PENDING.md`

### Risk & rollback

<!-- What could this break? How would we undo it?
     If it touches a safety mechanism, say so explicitly here. -->

### Reviewer

<!-- Cross-lane: Lane A reviews Lane B and vice versa. Never your own work.
     Formula changes additionally need Aviation validator approval. -->
