---
'@object-ui/core': minor
'@object-ui/plugin-calendar': minor
'@object-ui/plugin-grid': minor
'@object-ui/plugin-map': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-tree': minor
---

**Breaking behaviour change — a view block now honours only the `data` spelling its published row declares.**

Maintainer ruling, decision batch #83 (2026-09-08), verbatim 「8348 以协议为准」: the contract decides. What `os validate` and the save gate refuse under `data`, the renderer refuses too. The shared record-source ladder (`resolveRecordSourceConfig` in `@object-ui/core`) now takes the arm the calling block's row declares, and rung 1 applies only on that arm.

⚠️ **`object-calendar` documents authored against the tolerated spelling stop rendering those rows.** The ladder falls past `data` to `staticData`, then to `objectName` — so such a calendar queries its object instead, or draws nothing when it names neither. This is accepted, with no transition window and no staged deprecation (the standing 2026-08-27 posture).

**Per block — what the published row says, and what actually moves:**

- **`object-calendar`** — row: `ComponentPropsMap['object-calendar'].data` is `z.array(z.unknown())` ("Pre-fetched records — skips the internal fetch"). A record-source **config object** under `data` — `{ provider: 'value', items }`, `{ provider: 'object', object }`, `{ provider: 'api', … }` — is no longer honoured, and this is a real end-to-end change: that object had exactly one carrier into the block, so an authored calendar written that way now queries its object (or draws nothing) instead of drawing the authored rows. There is no longer an api-provider branch to reach here. An **array** under `data` is unchanged, as are `staticData` and `objectName`.
- **`object-grid`** — row: the `ViewData` union, whose own description says "the bare-array shortcut is refused". `getDataConfig`'s `Array.isArray(schema.data)` head is removed, so the array is no longer a record source at the ladder. ⛔ Measured: this is **not** an end-to-end change for a node rendered through `SchemaRenderer`. An authored `data` array also arrives on the **props channel** (`SchemaRenderer` spreads node keys as props; `ObjectGrid`'s `passedData` lifts an array at higher priority), so such a grid still draws its rows. The removal takes the second read, not the last one.
- **`object-map`** — no `ComponentPropsMap` row exists; the governing row is this repo's own `ObjectMapSchema.data`, `ViewDataSchema.optional()`. Its array-shorthand head is removed on the same terms, with the same measured caveat: through `SchemaRenderer` the props channel still draws an authored array. `data: { provider: 'value', items }` and `staticData` are unchanged.
- **`object-gantt`** — no `ComponentPropsMap` row; the governing row is `ObjectGanttSchema.data`, `ViewDataSchema.optional()`. A bare array under `data` is no longer a record source. Nothing observable moves: this block never lifted one, the array carried no `provider` and matched no fetch branch, and its renderer forwards no host props.
- **`object-tree`** — **unchanged.** No published face declares a `data` row for this block: not `ComponentPropsMap`, not `ObjectTreeSchema` (which declares `objectName` required and no `data`), not its registration `inputs`. Neither arm of the ruling reaches it, so its rung 1 keeps its previous behaviour and the block is reported rather than guessed at.

The `data` **prop** — the pre-fetched rows a host such as `ObjectView` or `ListView` passes down — is a different carrier and is untouched on every block. That it is also reachable from an authored node key, because `SchemaRenderer` spreads node keys as props, is what limits the grid and map halves above; it is reported on objectui#8348 rather than changed here.
