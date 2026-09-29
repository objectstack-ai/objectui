---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** nineteen ADR-0080 public-block
arms and the dashboard widget slot's `metric-card` node now refuse an authored
`children` by name. None of these renderers reads the node's child list, so the
key rendered nothing, with no render-time error or warning and no element
(objectui#9256).

- `page:header`, `page:tabs`, `page:accordion`, `record:details`,
  `record:highlights`, `record:related_list`, `record:path`, `record:activity`,
  `record:discussion`, `record:history`, `record:quick_actions`,
  `record:reference_rail`, `element:text`, `element:number`, `element:button`,
  `element:divider`, `object-metric` and `object-master-detail-form`: `children`
  and `body` are declared as by-name refusals on the zod arm, each kept a member.
  This package has no TypeScript declaration of these nodes, so the zod face is
  the only one that changes.
- `record:alert`: `children` only. Its `body` is the alert's message text, not a
  content channel, and is left as it was.
- `page:tabs` and `page:accordion`: the node's own `children` only. Each item's
  `children` in `items` stays live — that is what these blocks render.
- `metric-card` in a dashboard's `widgets`: `children?: never` and `body?: never`
  on the TypeScript face (`DashboardWidgetSlotComponentSchema`), and both keys
  refused by name on its zod twin. That twin is the first arm of the widget
  slot's union, so the refusal reaches the author inside the union's
  `invalid_union` issue at the widget's path, beside the strict widget schema's
  `unrecognized_keys`; `objectui validate` prints it as one arm of two.

What moves for an author:

- `children` on any of these nodes parsed green (and, on `metric-card`, also
  type-checked). It is now refused at `safeParse` time at its own path — on
  `metric-card`, under the widget's `invalid_union` — and on
  `DashboardWidgetSlotComponentSchema` at authoring time.
- `body` was already refused on all of them, by `BaseSchema`. Everywhere except
  `record:alert`, the zod refusal message now names what the node renders
  instead, where it used to point at `children`, which these nodes do not read
  either.

No render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

Migration: each of these nodes renders from its own keys, so there is no channel
to move the content to. Put it in the key the node does render
(`element:text`'s `properties.content`, the item-level `children` of a
`page:tabs` or `page:accordion` item, `record:alert`'s `properties.body`), place
it beside the node in a container that reads `children` (`page:section`,
`page:card`), or drop it.

Also, text only: `CodeEditorSchema.children`'s docblock now names `onChange`
among the keys `CodeEditorRenderer` forwards to Monaco.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.

⚠️ **Dated note, 2026-09-29 — `record:alert`'s flat `body` — objectui#10872 batch 3.** Later in this same release `record:alert`'s arm restates `body` as well: not with this entry's neither-channel guidance, since its `body` is the message text, but with an alias refusal that names `properties.body`, where that text lives. So the `record:alert` bullet's "is left as it was", and "Everywhere except `record:alert`" under "What moves for an author", no longer describe the release as a whole: a flat `body` on `record:alert` is still refused, and its message no longer points at `children` either. The rest of this entry is kept as the reading of this change.
