---
'@object-ui/types': patch
---

Repair the `object-map` and `object-gantt` mirrors: `objectName` is optional,
and a refinement requires that at least one of `data`, `staticData`,
`objectName` is present (maintainer ruling recorded 2026-09-02 — this is one
of the eight groups under that ruling, dispatched as its own PR per the
ruling).

Both renderers resolve their records from one of three keys, in this order —
`getDataConfig` in `plugin-map/src/ObjectMap.tsx` and
`plugin-gantt/src/ObjectGantt.tsx`: `data`, then `staticData`, then
`objectName`. Both mirrors required `objectName` alone, so a document authored
on `staticData` drew correctly and was refused by `safeValidateSchema` — six
catalog entries, three per component.

- **`object-map`** / **`object-gantt`**: `objectName` becomes optional on the
  mirror and on the TypeScript twin in the same stroke, and each member ends in
  `requireRecordSource`, whose issue sits at the root path, carries
  `params.code = 'RECORD_SOURCE_REQUIRED'` and names the three keys an author
  can supply.
- **`object-gantt`** additionally declares `data` (as `ViewDataSchema`, the
  spelling `object-map` already used): it is the FIRST key that resolver reads
  and was undeclared on both faces, which would have left the refinement naming
  a key the validator had never heard of.

**patch, not minor: the accept set only widens toward what already renders.**
Every document that validated before still validates — `objectName` alone,
including an empty one, still parses, because presence is `!== undefined` and
not the renderer's truthiness. The one shape the refinement refuses (none of
the three) was refused before too, when `objectName` was required. Documents
the renderers already draw start validating.

**Correction, 2026-10-01 (objectui#11117).** "The one shape the refinement refuses (none of the
three)" is narrower now: a node with none of the three that names its object in a
`dataSource` binding (`dataSource: { object }`, a non-empty name) parses, because the
registration's `ElementDataSourceGate` lands that object on `objectName`. The refusal now names
the binding beside the three keys.
