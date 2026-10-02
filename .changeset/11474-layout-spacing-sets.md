---
'@object-ui/types': minor
'@object-ui/components': minor
'@object-ui/core': minor
---

The `gap` of a `stack`, a `flex` and a `grid` node is one of the steps its renderer maps.
Any other number is refused at validation, with the set named (objectui#11474).

| node | accepted `gap` steps | default |
|---|---|---|
| `stack` | 0, 1, 2, 3, 4, 5, 6, 8, 10 | 2 |
| `flex` | 0, 1, 2, 3, 4, 5, 6, 7, 8 | 2 |
| `grid` | 0, 1, 2, 3, 4, 5, 6, 8, 10, 12 | 4 |

**Breaking for a `stack`, `flex` or `grid` that carries any other `gap` number.** The key
was declared as any number, and the `flex` and `grid` descriptions advertised "Tailwind
scale 0-8". But each renderer has one gap class per step and nothing for the rest:
`{ "type": "stack", "gap": 7 }` and `{ "type": "flex", "properties": { "gap": 9 } }` parsed
clean and rendered with no gap class at all, not even the default, because the default
applies only when the key is absent. A `grid` built a gap class at runtime for such a
number, and no compiled stylesheet defines a class built that way, so it rendered with no
gap either.

- `@object-ui/types`: `StackSchema.gap`, `FlexLayoutProps.gap` (which `FlexSchema` and the
  authored `flex` bag share) and `GridSchema.gap` are literal unions of the steps above on
  the TypeScript face, so `tsc` refuses any other number. The zod mirrors refuse one at the
  key (`invalid_value`, with the steps in the issue), with a message that lists the set. For
  `flex` that is `properties.gap`, and the flat spelling stays refused by name.
  `safeValidateSchema` (what `objectui validate` runs) and the strict authoring face both
  give that refusal. A `gap` that is not a number at all is now reported as `invalid_value`
  rather than `invalid_type`.
- `@object-ui/components`: the `gap` input of the `stack`, `flex` and `grid` registrations
  changes from `type: 'number'` to a closed `enum` of the same steps, in the object form the
  `container` registration's `padding` already uses. In the SDUI manifest, `validateTree`
  now answers an unlisted number with `invalid-enum`. The renderers are unchanged: they do
  not round or clamp, and an absent key still renders the default step.
- `@object-ui/core`: `GridBuilder.gap()` and `FlexBuilder.gap()` take the declared steps
  instead of any number.

Migration: replace the number with the step you meant from that node's set. `0` means no
gap.
