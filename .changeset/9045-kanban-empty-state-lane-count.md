---
'@object-ui/plugin-kanban': patch
---

The kanban board's "No cards" announcement no longer depends on how many lanes
it has (objectui#9045).

`KanbanImpl` derived its board-level empty state from
`totalCardCount === 0 && boardColumns.length > 1`. The second conjunct is a
**lane count**, and it made the announcement unreachable on two shapes:

- a **zero-lane** board — no lanes at all, so nothing on screen said anything;
- a **one-lane** board — the board-level live region never painted, and the only
  "No cards" string was the lane's own dashed placeholder: a plain `span` with
  no `role` and no `aria-live`.

`DataEmptyState` is the board's only `role="status" aria-live="polite"` region,
so on both shapes a screen-reader user was told nothing at all.

## Why now

A lane-less `object-kanban` document could not pass validation until
objectui#9021 made `ObjectKanbanSchema.groupBy` optional, as the protocol
declares it. A schema-valid `{ type: 'object-kanban', objectName }` now reaches
a board with no lane key — zero cards, and a silent blank. The predicate is
older than that card and **this is not a defect #9021 introduced**; the widening
is what made it reachable.

## What changed

The predicate asks whether there are any **cards**:
`totalCardCount === 0`. Nothing else moved — no exported symbol, no schema, no
published payload.

## ⚠️ The lane count was not guarding the loading state

The plausible reading — that `> 1` separated "still loading" from "genuinely
empty", since a board mid-flight can look lane-less — was measured, not assumed.
It is wrong: that distinction is carried by a **separate** conjunct,
`recordsSettled` (objectui#8827), which this change does not touch. A zero-lane
and a one-lane board are each driven with their query held in flight and
announce nothing, then announce once it settles with no rows.

## What a one-lane board now renders

Exactly what a multi-lane empty board has always rendered: the board-level live
region, and no per-lane placeholder. `suppressEmptyPlaceholder` is unchanged —
its stated reason is that the board-level state is already saying it, so a
per-lane copy would be a duplicate, and on a one-lane empty board that reason is
now **true** where it used to be vacuous. The board-level region is a live
region and the placeholder never was, so the visible affordance moves up one
level while the announcement is gained.

## What did not change

A multi-lane board **with** cards still announces nothing, and a multi-lane
board with **no** cards still announces — both were already correct and both are
pinned as non-regressions, not as evidence of this fix. Nothing may announce
while the records are in flight, on any lane count.
