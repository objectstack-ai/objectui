---
'@object-ui/types': minor
---

**BREAKING (shipped as `minor` — see below):** thirteen node types now refuse
both content channels by name. Each one's renderer reads neither `body` nor
`children`, so an authored child list on it rendered nothing, with no
render-time error or warning and no element; only the parser tier's
`not-a-container` warning (objectui#9910) noticed it (objectui#9256).

- `markdown`, `chart`, `bar-chart`, `code-editor`, `detail`, `report`: both keys
  are now `?: never` on the TypeScript face (`MarkdownSchema`, `ChartSchema`,
  `BarChartSchema`, `CodeEditorSchema`, `DetailSchema`,
  `ReportComponentSchema`) and a by-name refusal on the zod mirror, each kept a
  member of the mirror shape.
- `list-view`: a by-name refusal on the zod mirror. `ListViewSchema`'s
  TypeScript face is derived from that mirror, so it refuses both keys too.
- `page-designer`, `data-model-designer`, `process-designer`,
  `report-designer`, `object-manager`, `field-designer`: `?: never` on the
  TypeScript face (`PageDesignerSchema`, `DataModelDesignerSchema`,
  `ProcessDesignerSchema`, `ReportDesignerSchema`, `ObjectManagerSchema`,
  `FieldDesignerSchema`). None of them has a zod mirror, so the TypeScript face
  is the only one that changes.

What moves for an author:

- `children` on any of these nodes type-checked, and parsed green where a zod
  mirror exists; it is now refused at authoring time and, where a zod mirror
  exists, at `safeParse` time, at its own path.
- `body` was already refused on these faces, by `BaseSchema`. On the zod
  mirrors its refusal message now names what the node renders instead, where
  it used to point at `children`, which these nodes do not read either.

No render behaviour changes: nothing read these keys, which is the whole reason
they could be refused.

Migration: each of these nodes renders from its own keys, so there is no channel
to move the content to. Put it in the key the node does render (`markdown`'s
`content`, a `detail` tab's `content`, a chart's `data`), place it beside the
node in a container that reads `children`, or drop it.

`minor` rather than `major` because this repo's version policy forbids `major`
in any changeset — one `fixed` group — and records `minor` plus an explicit
breaking note as the spelling for a breaking change here.
