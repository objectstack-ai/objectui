---
'@object-ui/types': minor
'@object-ui/components': minor
---

A `grid` node sets a column count per breakpoint in one way: the breakpoint object of `columns`.
The flat `smColumns`, `mdColumns`, `lgColumns` and `xlColumns` keys are retired, with no alias
and no deprecation window (objectui#11505).

**Breaking for a `grid` that carries a flat column key.** The `grid` registration offered the four
keys as inputs and seeded two of them, and the renderer read each one over the breakpoint object.
No face of `GridSchema` declared them: the strict authoring face refused each key at every value,
and `safeValidateSchema` (what `objectui validate` runs) passed any value through unexamined, so
`"mdColumns": "wide"` validated.

- `@object-ui/types`: `GridSchema` declares the four keys as refusals on both faces. On the
  TypeScript face each is a `?: never` tombstone, so `tsc` refuses it by name. The zod mirror
  refuses every value at the key's own path with a message that names the breakpoint object member
  to write instead (`columns: { md: N }`), on `safeValidateSchema` and on the strict authoring face
  alike. The strict face answered `unrecognized_keys` before; it now gives that named refusal.
- `@object-ui/components`: the `grid` registration publishes `columns` as its only column input,
  and seeds `columns: { xs: 1, md: 2, lg: 4 }` in place of `columns: 1`, `mdColumns: 2` and
  `lgColumns: 4`. The seeded grid draws the same classes as before,
  `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4`. The renderer no longer reads the four
  keys: a document that reaches it unvalidated draws exactly what it draws without them, and the
  keys are never forwarded to the DOM. In the SDUI manifest, `validateTree` answers each with an
  `unknown-prop` warning, where `smColumns: 13` drew `invalid-enum` before.

Migration: move each count into the `columns` object under its breakpoint. A bare `columns: C`
beside a flat key becomes the object's `xs: C`, because a flat key switched off the bare count's
mobile-first ramp. With no `columns` at all, add `xs: 2` to keep the two columns the grid drew
below that breakpoint. So `{ "columns": 1, "mdColumns": 2, "lgColumns": 4 }` becomes
`{ "columns": { "xs": 1, "md": 2, "lg": 4 } }`, and `{ "smColumns": 3 }` becomes
`{ "columns": { "xs": 2, "sm": 3 } }`. Each migrated form draws the classes its flat form drew.
