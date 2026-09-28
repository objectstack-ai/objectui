---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** twelve node types now refuse both
content channels by name — `object-grid`, `object-form`, `object-kanban`,
`object-map`, `object-tree`, `object-view`, `object-gantt`, `object-calendar`,
`object-chart`, `detail-view`, `email` and `password`. None of their renderers
reads `body` or `children`, so an authored child list on them rendered nothing:
no error, no warning, no element. Both keys are now `?: never` on the TypeScript
face and a by-name refusal on the zod mirror, each kept a member of the mirror
shape.

What moves for an author:

- `children` on any of the twelve type-checked and parsed green before; it is now
  refused at authoring time and at `safeParse` time, at its own path.
- `body` was already refused on the ten `object-*` / `detail-view` nodes, on both
  faces, and by the zod mirror on `email` / `password`. Its refusal message on all
  twelve now names what the node renders instead, where it used to point at
  `children`, which these nodes do not read either.
- The TypeScript faces of `email` / `password` (`InputShorthandSchema`) and
  `ui:calendar` (`UiCalendarSchema`) now carry every member they inherit. Both were
  spelled as an `Omit` over an interface with an index signature, which erased
  every inherited member, so each face checked only the keys it wrote itself and
  accepted every other key at `any`. Now `body`, `children` and a wrongly typed
  inherited member — `label: 42` on `email`, a `mode` outside `single` /
  `multiple` / `range` on `ui:calendar` — no longer type-check there. An undeclared
  key still type-checks on both repaired faces: the index signature is kept.
- The `body` / `children` refusal text on `calendar` and `ui:calendar` changes
  wording only, because it described the erased TypeScript face; their zod mirrors
  accept exactly what they accepted before.

No render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

Migration: move the content to the channel the component renders, or drop it. On
`detail-view` that is `header`, `footer` or a tab's `content`; for the others,
place the content beside the node in a container that reads `children`.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.
