---
'@object-ui/types': minor
'@object-ui/components': minor
---

A `container` node's `padding` is one of the twelve steps its renderer maps: 0 to 8, 10, 12
and 16. Any other number is refused at validation, with the set named (objectui#11424).

**Breaking for a `container` that carries any other `padding` number.** The key was declared
as any number, but the `container` renderer has one padding class per step and nothing for
the rest. So `padding: 9` or `padding: 20` parsed clean and the container rendered with no
padding class at all, not even the default `4`, because the default applies only when the key
is absent.

- `@object-ui/types`: `ContainerSchema.padding` is the literal union
  `0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12 | 16` on the TypeScript face, so `tsc` refuses
  any other number. The zod mirror refuses one at `padding` (`invalid_value`, with the twelve
  values in the issue), with a message that lists the set. `safeValidateSchema` (what
  `objectui validate` runs) and the strict authoring face both give that refusal.
- `@object-ui/components`: the `container` registration's `padding` input changes from
  `type: 'number'` to a closed `enum` of the same twelve numbers, in the object form
  `maxWidth` already uses. In the SDUI manifest, `validateTree` now answers an unlisted number
  with `invalid-enum`, and the generated intrinsics type the prop as the twelve literals. The
  renderer is unchanged: it does not round or clamp, and an absent key still renders the
  default step `4`.

Migration: replace the number with the step you meant from the set. `0` means no padding.
