---
'@object-ui/types': minor
---

**BREAKING — `ObjectCalendarSchema.data` narrows from the `ViewData` provider block to the protocol's ARRAY of pre-fetched records, on both published faces.**

`ComponentPropsMap['object-calendar'].data` on `@objectstack/spec` declares `z.array(z.unknown()).optional()` — *"Pre-fetched records — skips the internal fetch"*. Both published faces of this package declared `ViewData` on the same key instead: a `{ provider, items }` config object, which that row refuses BY KIND. One key, two published shapes that refuse each other.

After objectui#8348 put the renderer on the protocol's side (maintainer ruling, decision batch #83, 2026-09-08, verbatim 「8348 以协议为准」), this package's mirror was the LONE published face still teaching the config-object spelling. An author who validated metadata against `@object-ui/types` got a green verdict for a document the renderer ignores, `os validate` refuses and the save gate rejects — `declared !== enforced` with the declaration on the wrong side, the shape AGENTS.md #0.1 exists to prevent. objectui#9239 brings the declaration onto the contract.

**What changes for authors**

- `ObjectCalendarSchema` (TypeScript): `data?: ViewData` becomes `data?: unknown[]`, DERIVED from the protocol's own row rather than re-spelled, so the key cannot drift from it a second time. A calendar literal carrying `data: { provider: 'value', items: [...] }` is now a compile error at `data`; an array of records compiles.
- `ObjectCalendarSchema` (Zod mirror, reached by `safeValidateSchema` and so by the CLI's `validate` / `check`): `ViewDataSchema.optional()` becomes `z.array(z.unknown()).optional()`. The config object is now refused AT the key; an array is accepted.
- Requiredness is unchanged — optional on both faces, as before — so the `zod-mirror-parity` ratchet is unmoved.

⛔ **The accept set genuinely shrinks. That is the point**, and it is a narrowing onto a contract `@objectstack/spec` already publishes, not a new dialect: every document this declaration now refuses was already refused by the protocol, by `os validate`, by the save gate and by the renderer. Nothing that renders today stops rendering because of this change — objectui#8348 is where the runtime behaviour moved.

**What does NOT change**

- `staticData` and `objectName` are untouched on this block, and so is the three-rung record-source ladder: `requireRecordSource` asks only whether a rung is PRESENT, whatever the value's kind.
- ⛔ `ObjectMapSchema.data` and `ObjectGanttSchema.data` stay `ViewData`. Neither block has a `ComponentPropsMap` row, so the published row that governs them is this package's own — they are not following, and the type-level equality that used to bind the calendar's `data` to the gantt's is now pinned as a DIFFERENCE rather than deleted.
- ⛔ `@objectstack/spec` itself is not touched.

Refs: objectui#9239 · objectui#8348 (the ruling and the renderer half) · objectui#7313 (which declared this key, in the provider-block arm) · objectui#4631
