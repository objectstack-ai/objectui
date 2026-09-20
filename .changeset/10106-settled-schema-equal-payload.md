---
'@object-ui/react': patch
---

`useSettledSchema` no longer republishes an EQUAL definition as a new object,
so swapping the adapter on a record-bound view costs ONE record query instead
of two.

The hook refetches `getObjectSchema` whenever the adapter identity changes, and
every consumer its doc comment instructs — `ObjectGantt`, `ObjectCalendar`,
`ObjectView`, `ObjectTimeline`, `ObjectGallery` — keys its record fetch on the
returned `def`, which is what `AGENTS.md` §5 commandment #10 tells a consumer to
do (key on the payload, never on a memo identity). The producer half of that
same sentence is what this fixes: a byte-identical answer arriving as a fresh
object re-fired every one of those fetches, and the duplicate query carried the
same `$expand` set as the one before it. Measured first-hand on `ObjectGantt`
with an instrumented adapter, with a control swap in the same command; the
counts, and the control that makes them a discrimination rather than a counting
artefact, are asserted by
`packages/react/src/hooks/__tests__/useSettledSchema.equalPayload-10106.test.tsx`
(objectui#10106).

A definition that genuinely CHANGED across the swap still publishes a new
object and still re-queries — that case is pinned in the same file, because
"fetch less" would have been the wrong repair.
