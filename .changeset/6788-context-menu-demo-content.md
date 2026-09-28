---
---

docs(context-menu): the basic-context-menu demo authors its trigger text under
`children`, the key `ui:card` reads.

The demo authored `{ "type": "card", "content": "Right-click here" }`.
`packages/components/src/renderers/layout/card.tsx` reads `title`,
`description`, `header`, `children || body` and `footer` — never `content` —
and `content` is not among the `ui:card` registration's declared `inputs`
either. So the published tile drew an empty dashed box and the instruction
reached the DOM only as the leaked host attribute `content="Right-click here"`
(the objectui#5574 class).

`children` rather than `body`: `card.tsx` accepts both, but `body` is marked
legacy on `BaseSchema` and objectui#6771 is retiring it as a `children`
dialect, and objectui#6773 authored `children` in the four sibling
`aspect-ratio` card demos. The renderer was NOT widened to read `content` —
that would add a second dialect for one slot to a published surface.

⚠️ **Dated note, 2026-09-28 — `card` reads `children` alone — objectui#6771.** Since this
change, objectui#6771 retired `body` as a child-list spelling: the `children || body` read
above is now `children` alone, `CardSchema` declares `body` as `never` and its zod mirror
refuses it by name, and `BaseSchema.body` is `never` rather than a legacy member. So the
demo's `children` is the one spelling that renders, not the preferred one of two. The rest
of this entry is kept as the reading of this change.

No package source changed, so this declares no release.
