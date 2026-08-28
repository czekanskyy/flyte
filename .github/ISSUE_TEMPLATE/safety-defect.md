---
name: Safety defect
about: A wrong calculation, a missing warning, or a bypassed safety gate
title: "[SAFETY] "
labels: safety
assignees: ''
---

<!--
A safety defect is not an ordinary bug. Per docs/SAFETY.md §10:

  1. Open this issue BEFORE attempting a fix.
  2. Add a reproducing golden vector BEFORE changing any implementation code.
  3. Never adjust an existing golden vector to make a test pass.

If this defect is on `main`, say so in the title – it may already be in a printout
that someone is flying with.
-->

### What is wrong

<!-- The incorrect behaviour, stated plainly. -->

### Expected value and its source

<!-- What the correct answer is, and where that comes from: manual E6B, POH page,
     regulation article, chart, NOAA reference. "It looks wrong" is a starting point,
     not a report. -->

### Actual value

### Reproduction

<!-- Exact inputs. If it is a calculation, give every input including units. -->

```json
{ }
```

### Scope of exposure

- [ ] Present on `main`
- [ ] May have appeared in a generated OFP or FPL
- [ ] Affects a printed document already in use
- [ ] Development only, never released

### Category

- [ ] Wrong calculation
- [ ] Missing or incorrect data-freshness indicator
- [ ] Rounding in the unsafe direction
- [ ] Silent fallback or invented default where data was missing
- [ ] `NaN` / `Infinity` escaping the calculation engine
- [ ] Unverified data not marked as unverified
- [ ] Safety gate bypassable
- [ ] Attribution appearing on printed output

### Reproducing golden vector

<!-- Required before any fix. Paste it here, then commit it as a FAILING test. -->

```json
{
  "id": "",
  "source": "",
  "given": { },
  "expect": { },
  "tolerance": 0
}
```
