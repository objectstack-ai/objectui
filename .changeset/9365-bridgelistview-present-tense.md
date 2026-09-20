---
'@object-ui/types': patch
---

Date the dead `bridgeListView` producer evidence in `BaseSchema` instead of
letting it read as live (objectui#9365).

`base.ts` stated the factual basis of objectui#4580's revised Q1 ruling in the
PRESENT tense — "that is what a spec producer already writes into this slot:
`bridgeListView` assigns `node.label = spec.label`", and the same shape one slot
over for `description`. Both sentences were TRUE when PR #4608 wrote them on
2026-08-13: at that commit `packages/react/src/spec-bridge/bridges/list-view.ts`
exported `bridgeListView` and carried `if (spec.label) node.label = spec.label;`
and `if (spec.description) node.description = spec.description;` at exactly the
addresses cited. objectui#6366 (PR #6632, 2026-08-29) then removed the WHOLE
spec-bridge — `SpecBridge`, `bridgeListView`, `bridgeFormView` — from
`@object-ui/react` as a declared BREAKING CHANGE, and the producer, its module
and those addresses went with it.

They are therefore ROTTED, not born false, and the repair matches: the original
sentences are KEPT, quoted, dated to the commit that wrote them, and followed by
a dated note naming objectui#6366 as what falsified them. Overwriting them would
erase that objectui#4580 ever had a stated rationale, which is a false record of
its own.

What the docblocks now assert instead points at an instrument rather than at a
retired producer: the widening is re-derived on every run by
`inline-locale-declared-face-9092.test.ts` in this package, under both `tsc` and
vitest, and the read half by the renderer pins in `@object-ui/components` and
`@object-ui/plugin-dashboard`. No figure is written down (AGENTS.md #9).
objectui#4580's ruling itself is untouched and is not re-litigated here.

⛔ Nothing executable moves — the diff is comment-only: no declaration, accept
set, assertion, behaviour or export changes. It is graded `patch` rather than a
no-release changeset because the published bytes move: these docblocks ship in
`dist/base.d.ts`, which this package's `files[]` publishes, measured after a
build with a positive control on neighbouring prose in the same emitted file and
a minted-token absent control.
