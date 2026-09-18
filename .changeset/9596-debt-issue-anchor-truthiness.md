---
---

Tighten the `DEBT_ISSUE` anchor pin in
`scripts/__tests__/spec-symbol-ledger-plugin-detail-7265.test.ts` so it asserts
the invariant its own comment claims: the stale-entry tail is switched ON, not
merely that an anchor is spelled with digits. A zero satisfied the old digit
class while being falsy, so the tail could be switched off with every pin in the
file green (objectui#9596). Test only; no package is released by this change.
