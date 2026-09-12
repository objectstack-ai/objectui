---
"@object-ui/types": minor
"@object-ui/plugin-list": minor
---

**A stray `groupBy` in a view's kanban config no longer overrides the lane, and is now refused by name.**

`ListView`'s kanban branch destructured
`columns`/`groupByField`/`groupField`/`cardFields`/`titleField` out of the merged
kanban config and spread the **rest** *after* its own `groupBy: laneField`. A
`groupBy` surviving in that bag therefore **overrode the lane the branch had just
resolved**. Measured on a distinguishing fixture, not reasoned: with
`options.kanban = { groupBy: 'LANE_FROM_STRAY_GROUPBY' }` against
`kanban = { groupByField: 'LANE_FROM_CANONICAL' }`, the generated `object-kanban`
node carried `groupBy: 'LANE_FROM_STRAY_GROUPBY'`. It read as latent only because
the one producer that fed it wrote both spellings with the same value by
construction; that producer was retired separately, and this closes the override
itself.

Two halves, per the maintainer's ruling (option B — a silent re-grouping was the
fallback and was **not** taken):

1. **The canonical lane wins.** `groupBy` joins the destructure, so the stray key
   can no longer reach the passthrough spread. A view that authored it now groups
   by whatever `groupByField` / `groupField` / the declared lifecycle field
   resolves.
2. **The stray key is refused loudly, at the read door of the view.** This repo's
   `.passthrough()` `KanbanConfig` mirror (`@object-ui/types`) declares `groupBy`
   as a named alias refusal pointing at `groupByField`, in the same sentence
   shape `@objectstack/spec` already answers the sibling alias with — "Unrecognized
   key(s) on this kanban configuration: `groupBy`. Did you mean `groupBy` →
   `groupByField`?". The refusal lands wherever a view's metadata is validated:
   the CLI's `os check` / `os validate`, the VS Code extension, and `tsc` at the
   authoring site (the inferred authoring face now carries `groupBy?: never`).
   The legacy `options.kanban` nesting — where the retired producer wrote, and so
   where stored views carry the key — takes the identical message through a check
   on that untyped bag.

**Breaking, in the sense worth stating explicitly** (shipped `minor`: this repo
never declares `major`, and `.changeset/config.json` puts every package in one
`fixed` group, so levels cannot be split). Two behaviours change for **stored
data**, which is why this is not a patch:

- a stored view authoring `kanban.groupBy` (either nesting) **re-points its lane**
  — it used to group by the stray key and now groups by the canonical binding, so
  its board may show different columns;
- the same document now **fails validation** where it used to pass: any pipeline
  running `safeValidateSchema` over it (`os check`, `os validate`, the extension)
  reports one issue naming the key and the replacement.

Honouring `groupBy` as a declared alias was never an option here:
`@objectstack/spec`'s `KanbanConfigSchema` is a strict object of
`columns` / `groupByField` / `summarizeField` and refuses it by name — re-measured
on the pinned 17.4.0 with both controls firing — so legalising it would be a spec
change, not a renderer widening (AGENTS.md #0.1).

`groupBy` on the generated `object-kanban` **node** is untouched: that is the live,
canonical lane key `ObjectKanban` reads. Only the **view-level** kanban config
spelling is refused. The `.passthrough()` itself is kept — an undeclared sibling
key still rides through, which is pinned as a control.
