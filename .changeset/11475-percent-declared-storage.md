---
'@object-ui/core': minor
'@object-ui/fields': minor
---

**BREAKING: a percentage is scaled at the storage its field declares, never at a storage guessed from the value (objectui#11475)**

`percentDisplayValue` (`@object-ui/core`) and `formatPercent`
(`@object-ui/fields`) now take the storage as a required argument, the spec's
`PercentScale` (`'fraction'` or `'whole'`):

- FROM `percentDisplayValue(value)` TO `percentDisplayValue(value, percentScale)`.
- FROM `formatPercent(value, precision, locale)` TO
  `formatPercent(value, percentScale, precision, locale)`.

A value outside `'fraction' | 'whole'` throws a `TypeError` instead of falling
to a branch silently.

Why: the old body, `value > -1 && value < 1 ? value * 100 : value`, read neither
the field nor its `max`. The read-only form reads the declaration, so one
stored value read two percentages on two faces of the same record. A
fraction-stored `1` (100%) read `100%` in the form and `1%` in the list cell. A
whole-stored `0.5` (`max: 100`) read `0.5%` in the form and `50%` in the cell.

What callers pass now:

- A face holding a field reads the spec's `percentScaleOf`
  (`@objectstack/spec/data`): a `percent` field stores a fraction unless it
  declares a `max` above 1. `@object-ui/fields` adds `percentCellScale(field)`,
  the answer the percent cell reads, so every face that renders the cell's
  number for the same field reads it by reference. `PercentField` asks
  `percentScaleOf` itself instead of restating the rule, so there is one
  convention, not two equal copies.
- A `progress` field is read as `'whole'`, and the reason is written at the
  call site. The spec's `percentScaleOf` gives no answer for `progress`, and
  its only editor, `SliderField`, stores the slider position on a `0`–`100`
  range. So a value strictly between 0 and 1 on a `progress` column now reads as
  a fraction of one percent, where the old guess multiplied it by 100.
- A dataset measure keeps the server's `percentScale` annotation. A column the
  server does not annotate is, in the contract's words, "not a percentage". Its
  `%` pattern is then read the way numeral reads it, as a fraction. Before, it
  fell to the magnitude guess, so an unannotated `57` read `57%` and now reads
  `5700%`. Every first-party `%` measure is a ratio the server annotates, so
  none of them moves.

⚠️ The loss, stated: the legacy `ReportViewer` (`@object-ui/plugin-report`)
draws a report column of `type: 'percent'` through the percent cell. That
column is the report's own `ReportField`, which declares no `max`, and the
viewer does not hydrate it from the bound object's field. So the column reads
the spec's answer for a percent that declares nothing: a fraction. A legacy
report over a whole-stored field now reads `50` as `5000%`. Measured at
`6007dd4e4`: no producer in objectui or objectstack writes a `percent` column
into a legacy report. The pre-9.0 spec bridge (`specReportToPresentation`)
writes columns with no `type` at all, so its columns never reach the percent
cell.

Migration: pass the storage your value is in. With a field definition in hand,
pass `percentCellScale(field)` from `@object-ui/fields` (or the spec's
`percentScaleOf(field)` for a `percent` field). For a computed ratio, pass
`'fraction'`. For a value already in percentage points, pass `'whole'`.

`minor`, not `major`: a `major` in the fixed group would move the whole group
off `@objectstack`'s major (AGENTS.md, version alignment). The breaking
semantics are stated here instead of carried by the level.
