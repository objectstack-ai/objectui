---
'@object-ui/plugin-dashboard': minor
---

Converge the metric tile's percent `format` branch onto the repo's single percent
display rule (objectui#9165).

`formatMetricValue` in `MetricWidget.tsx` held a **second, drifted copy** of the
percent display rule. It was spelled inside out — a pass-through guarded by a
greater-than-one test with the multiply in the else arm — so it scaled everything
at or below `1` and passed through everything above, where the declared source
(`percentDisplayValue` in `@object-ui/core`) is the symmetric
`value > -1 && value < 1`. The negative half was unguarded and the boundary sat
on the wrong side of `1`. Because of that spelling, objectui#9071's census could
not see it: "the only `num <= 1` spelling in the repo" was true of the SPELLING
and false of the DRIFT.

The branch now hands the raw stored value to `formatPercent` — the identical call
this package's own `renderFieldValue` already makes (objectui#5607) and the one
the list-view percent cell makes — so it takes BOTH halves the shared helper's doc
comment demands of a third surface: the SCALING and the locale's percent
CONVENTION. The decimal count still comes from this surface's numeral pattern
(`'0.00%'` renders two decimals), which is an author declaration on the widget
rather than a guess about the value.

**BREAKING — stored data renders differently on a KPI tile after this change.**
Nothing about the stored value moves; what moves is how the tile prints it. On a
`metric-card` with a percent pattern such as `'0%'`, measured against the
list-cell path in the same run:

| stored | before | after | why |
|---|---|---|---|
| `1` | `100%` | `1%` | exactly `1` is percentage points, not a fraction |
| `-1` | `-100%` | `-1%` | the negative half was unguarded |
| `-5` | `-500%` | `-5%` | same |
| `1234.5` | `1235%` | `1,235%` | the locale's grouping (objectui#4553's move) |
| `1234.5` (`de-DE`) | `1235%` | `1.235 %` | the locale's percent affix, no-break space included |
| `0.25` | `25%` | `25%` | unchanged — a fraction, scaled as before |
| `12.3` | `12%` | `12%` | unchanged — already percentage points |

The first three rows are the defect: the same stored number read `100%` on a KPI
tile and `1%` in the list cell beside it, which users report as a data bug rather
than a formatting one. The next two are the convention half, which brings the tile
in line with the list cell, the summary chip and the dataset measure formatter.

**Level.** `minor`, not `major` and not `patch`. This repo keeps its major aligned
with `@objectstack`'s (see AGENTS.md, "版本号策略") and ships breaking changes as
`minor` with a written breaking note; `scripts/check-changeset-no-major.mjs`
enforces that mechanically, and all packages sit in one `fixed` group so a split
changeset could not produce split levels anyway. `patch` would be wrong because
values that render correctly today (four-digit percents, every non-`en` session)
render differently afterwards.

**Migration.** If a dashboard stored whole-percent values in the `0`–`1` band and
relied on the tile's old scaling to print them (a stored `1` shown as `100%`), it
was already disagreeing with every other percent surface in the console; store the
fraction (`0.01`) or the points (`1`) consistently and both surfaces now agree.
