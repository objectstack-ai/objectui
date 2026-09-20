---
---

Test-only change (objectui#9813): the shared `explainDouble` helpers in
`plugin-grid` and `plugin-view` now answer a single-`recordId` request with the
`{ record: { visible } }` member, alongside the `{ records: [...] }` member they
already answered for a batched `recordIds`. Both helpers also take an optional
row verdict, so a suite can ask either of them for a DENY instead of
hand-rolling a second double; `allowed` stays `true` in both cases, because it
is the object-level verdict rather than the row-level one.

Before this, a single-`recordId` request came back with no `record` member at
all, and `useRecordEditable` — which reads `decision.record.visible` and returns
early when it is not a boolean — took its fail-open path through either helper:
the same path a refused connection produces, which is the escape these helpers
exist to close, and the opposite of the sentence their own docblocks carry.

Each copy gains a pin that drives that consumer through the singular path and
asserts the decision it reaches; the denying direction is the assertion that
fails without the repair. No published behaviour changes: both files sit under
`src/__tests__/`, which each package's build tsconfig excludes, and neither
package's built `dist` carries the helper.
