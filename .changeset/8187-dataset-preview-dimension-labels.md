---
'@object-ui/app-shell': minor
---

The metadata-admin dataset preview resolves its dimension values to labels, like every other analytics chart on the platform.

`@object-ui/core` exports one dimension-label net (`loadDimensionFieldMeta` →
`resolveDimensionFieldMeta` → `deriveDimensionLabelMaps` / `localizeFieldOptions`
→ `relabelDimensions`, objectui#4030 / PR #4324, widened by objectui#4330 /
PR #4388), with the React half — the authenticated read and its locale-free memo
— stated once in `@object-ui/react`'s `useDatasetDimensionLabels` (objectui#4389).
Enumerating the analytics chart producers by their every non-test call site of
`buildChartSeries` gives exactly three, and all three relabel immediately before
charting: `plugin-dashboard`'s `DatasetWidget`, `plugin-report`'s
`DatasetReportRenderer`, and `plugin-charts`' `ObjectChart`.

`DatasetPreview` is a fourth analytics chart on a different construction, and it
fell outside that enumeration because it never calls `buildChartSeries` — it
handed `state.rows` to `ChartRenderer` exactly as they arrived. Nothing was
missing structurally: the draft carries the base object and each dimension's
field path, and the preview already resolved its measure captions through
`headerLabel`. The call simply was not made, and nothing in the file declared
the omission deliberate.

Two user-visible readings change, and they are two different defects:

- a **dotted** dimension (`crm_account.industry`) plotted the **raw stored
  value**. The server resolves nothing for a dotted path — the options live on
  the relationship's target — so without the client net there was nothing on the
  axis but the enum (`MFG`). This is objectui#4053 / #4263's shape, one surface
  over;
- a **local** select plotted the object's **authored English** label on every
  locale, objectui#4330's shape.

Neither threw and neither was red: the axis rendered a plausible string where a
label belonged. That matters most on this particular surface, because it is the
screen an author uses to decide whether their dataset is right — a raw enum here
reads as "my dataset is wrong" and invites editing a configuration that was
correct.

The rows are relabelled ONCE and fed to both the chart and the result table
below it, which is what `DatasetWidget` and `DatasetReportRenderer` do for the
same reason: relabelling only the axis would put `Manufacturing` on a bar and
`MFG` in the row directly beneath it.

Behaviour is unchanged wherever the net resolves nothing. The read is
best-effort by construction — an unreachable relationship, a field with no
`options`, or a failed metadata read leaves the rows exactly as the server sent
them — and `relabelDimensions` is idempotent and never touches measure columns,
so a server-resolved value passes straight through. No new vocabulary, config
key or public surface: this is the existing net's fourth call site.
