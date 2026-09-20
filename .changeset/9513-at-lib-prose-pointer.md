---
---

Repair five `plugin-designer` test comments that justified index arithmetic by
writing down a `lib` level instead of pointing at the instrument that re-derives
it (objectui#9513, AGENTS.md commandment #9).

The primary one — the `lastSchema` docblock in
`DashboardEditor.i18nTitle.test.tsx` — asserted that `.at()` "type-checks
nowhere in this repo". Four siblings carried the weaker same-family claim that
"this package's tsconfig `lib` predates ES2022". All five went false together
when objectui#9512 raised the `lib` level of the per-package test tsconfigs, so
all five are repaired in one pass rather than describing an intermediate state.

The repair is a POINTER, not fresher data: each sentence now names
`pnpm census:tsconfig-test-parity` and its `lib` section, so no level, count or
package list is written down where it can go stale again. The helpers keep their
index arithmetic — that was never the defect, only the reason given for it.

Comments only; no assertion, fixture, import or test name changed, and no
package is released by this change.
