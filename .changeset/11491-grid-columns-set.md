---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/core': minor
---

The `columns` of a `grid` node is one of the counts its renderer maps, 1 to 12, as the bare
number and at every breakpoint of the object form. Any other count is refused at validation,
with the set named (objectui#11491).

**Breaking for a `grid` that carries any other column count.** The key was declared as any
number, at the bare number and at every breakpoint. But the renderer has one column class per
count from 1 to 12 at each breakpoint and nothing for the rest, so such a count drew no column
class where it was authored: `{ "type": "grid", "columns": 13 }` drew one column on a phone and
two from `sm` up, and never its `md` count; `{ "columns": { "md": 13 } }` drew nothing at `md`;
and `{ "columns": { "xs": 13 } }`, `"columns": 0` and `"columns": -1` drew two columns, a count
nobody authored.

- `@object-ui/types`: `GridSchema.columns` is the literal union of 1 to 12, or a partial
  breakpoint map of that union, on the TypeScript face, so `tsc` refuses any other count written
  as a literal (a computed `Record<string, number>` still assigns, as it did for keys since
  objectui#8505; the mirror judges its counts). The zod mirror refuses one at
  `columns` as an `invalid_union` whose message lists the set; its arms carry the set as
  `values`, at the breakpoint's own path for the object form. `safeValidateSchema` (what
  `objectui validate` runs) and the strict authoring face both give that refusal. An unknown
  breakpoint key is still reported on its own, as `unrecognized_keys`.
- `@object-ui/components`: the `grid` registration's `columns`, `smColumns`, `mdColumns`,
  `lgColumns` and `xlColumns` inputs change from `type: 'number'` to a closed `enum` of the
  twelve counts, in the object form the `container` registration's `padding` uses. `columns`
  also publishes the breakpoint object the declaration takes, as an `object` arm whose members
  (`of`) are the same list. In the SDUI manifest, `validateTree` now answers `smColumns: 13` with
  `invalid-enum`, `columns: 13` with an error-level `type-mismatch` that lists the counts, and
  `columns: { md: 13 }` with `member-type-mismatch`. A breakpoint object of mapped counts, which
  drew a `type-mismatch` warning there, is now accepted, as both declaration faces already
  accepted it. The renderer no longer draws `grid-cols-2` for a base count it does not map:
  every count a validated document can carry is mapped, and an unmapped one that reaches it
  unvalidated draws no base column class, as at every other breakpoint. Nothing rounds or
  clamps.
- `@object-ui/core`: `GridBuilder.columns()` takes the declared counts instead of any number.

Migration: replace the count with the one you meant, from 1 to 12. For a grid with no columns
at a breakpoint, leave that breakpoint out; for a single column, write `1`.
