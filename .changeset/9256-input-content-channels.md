---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** the `input` node type now refuses
both content channels by name. Its renderer reads neither `body` nor `children`,
so an authored child list on it rendered nothing, with no render-time error or
warning and no element; only the parser tier's `not-a-container` warning
(objectui#9910) noticed it. Both keys are now `?: never` on the TypeScript face (`InputSchema`) and
a by-name refusal on the zod mirror, each kept a member of the mirror shape.

What moves for an author:

- `children` on `input` type-checked and parsed green before; it is now refused
  at authoring time and at `safeParse` time, at its own path.
- `body` on `input` was already refused on both faces, by `BaseSchema`. Its
  refusal message now names what `input` renders instead, where it used to
  point at `children`, which `input` does not read either.
- `email` / `password` (`InputShorthandSchema`) accept and refuse exactly what
  they did before, with the same message. They already refused both channels
  with their own pair, which names those two nodes. They now also inherit
  `input`'s pair: on the TypeScript face it is the same `?: never`, and on the
  zod mirror their own members override it, so the message an author reads
  there does not change.

No render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

Migration: `input` renders one field from its own keys, so there is no channel
to move the content to. Put label or help text in `label`, `placeholder` or
`description`; place anything else beside the `input` in a container that reads
`children`, or drop it.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.
