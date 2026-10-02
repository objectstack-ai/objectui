---
'@object-ui/plugin-dashboard': minor
---

The `object-pivot` registration publishes `drillDown` as an input (objectui#11440).

`ObjectPivotTable` has always read `drillDown` (whether the drill is on, its filter, title, target, columns, row cap and report), and the `pivot` node's refusal of `drillDown` names `object-pivot` as where a pivot drill is authored. The registration did not list it, so the `sdui-parser` manifest and the designer did not offer it. Its description says `drillDown.mode` does not apply: every click point on a pivot is an aggregated bucket, so the pivot always drills through. `@object-ui/types/zod`'s new `object-pivot` arm declares the same member (`.changeset/11440-arm-passing-types.md`). Nothing else about the block changes.
