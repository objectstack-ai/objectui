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

⚠️ Stored documents authored against the previously tolerated spellings stop rendering those rows. The ladder falls past `data` to `staticData`, then to `objectName` — so such a block queries its object instead, or draws nothing when it names neither. This is accepted, with no transition window and no staged deprecation (the standing 2026-08-27 posture).

**Per block:**

- **`object-calendar`** — its row is `ComponentPropsMap['object-calendar'].data`, `z.array(z.unknown())` ("Pre-fetched records — skips the internal fetch"). A record-source **config object** under `data` — `{ provider: 'value', items }`, `{ provider: 'object', object }`, `{ provider: 'api', … }` — is no longer honoured. An **array** under `data` is unchanged, as are `staticData` and `objectName`. There is no longer an api-provider branch to reach on this block.
- **`object-grid`** — its row is the `ViewData` union, whose own description says "the bare-array shortcut is refused". `getDataConfig`'s `Array.isArray(schema.data)` head is removed: `data: [ …rows… ]` no longer draws those rows. Inline rows go under `data: { provider: 'value', items: [...] }` (or the deprecated `staticData`), both unchanged.
- **`object-map`** — no `ComponentPropsMap` row exists; the governing row is this repo's own `ObjectMapSchema.data`, `ViewDataSchema.optional()`. Its array-shorthand head is removed on the same terms as the grid's: `data: [ …rows… ]` no longer draws markers. `data: { provider: 'value', items }` and `staticData` are unchanged.
- **`object-gantt`** — no `ComponentPropsMap` row; the governing row is `ObjectGanttSchema.data`, `ViewDataSchema.optional()`. A bare array under `data` is no longer a record source. This block never lifted one, so nothing a published document can express moves: the array carried no `provider` and matched no fetch branch before either.
- **`object-tree`** — **unchanged.** No published face declares a `data` row for this block: not `ComponentPropsMap`, not `ObjectTreeSchema` (which declares `objectName` required and no `data`), not its registration `inputs`. Neither arm of the ruling reaches it, so its rung 1 keeps its previous behaviour and the block is reported rather than guessed at.

The `data` **prop** — the pre-fetched rows a host such as `ObjectView` or `ListView` passes down — is a different carrier and is untouched on every block.
