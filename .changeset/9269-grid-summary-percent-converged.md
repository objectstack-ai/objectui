---
'@object-ui/plugin-grid': minor
---

Converge the grid column-summary footer's percent arm onto the repo's single
percent display rule (objectui#9269).

`formatSummaryLabel` in `useColumnSummary.ts` held a **hand-inlined copy of
`percentDisplayValue`'s body** and then appended a **literal ASCII percent
sign**:

```ts
const decimals = column?.precision ?? 0;
const pct = (value > -1 && value < 1) ? value * 100 : value;
formatted = `${pct.toFixed(decimals)}%`;
```

Line 2 is the expression `percentDisplayValue` in `@object-ui/core` **is**,
character for character, so the SCALING agreed — by duplication rather than by
reference. The CONVENTION was not taken at all. That helper's own doc comment
makes this the judgement rather than a style preference: *"If a third surface
ever needs percent display, it takes BOTH halves from here — the scaling AND the
convention — or this promise breaks again in the same place."* A grid footer
showing a percent aggregate directly beneath the percent cells it aggregates is
such a surface, and it took neither half by reference.

The arm now hands the raw stored value to `formatPercent` — the same call the
list-view percent cell makes — with the tag from `useDisplayLocale()`, so the
footer takes the SCALING and the locale's percent CONVENTION from one home.
`decimals` still reads `column.precision`, unchanged.

**BREAKING — a percent column summary renders differently in every non-`en`
session, and for four-digit values in `en` too.** Nothing about the stored value
moves; what moves is how the footer prints it, and the move is the repair: the
footer now reads the same as the cells above it. Measured against the declared
source in the same run:

| locale | stored | before | after |
|---|---|---|---|
| `en` | `0.25` | `25%` | `25%` (unchanged) |
| `en` | `1` | `1%` | `1%` (unchanged) |
| `en` | `-5` | `-5%` | `-5%` (unchanged) |
| `en` | `12.3` | `12%` | `12%` (unchanged) |
| `en` | `1234.5` | `1235%` | `1,235%` — grouping |
| `de-DE` | `0.25` | `25%` | `25 %` — no-break space before the sign |
| `de-DE` | `1234.5` | `1235%` | `1.235 %` — grouping and affix |
| `tr-TR` | `0.25` | `25%` | `%25` — **the sign moves to the FRONT** |
| `tr-TR` | `1234.5` | `1235%` | `%1.235` — same |

Every `en` row below four digits is byte-identical, which is exactly why a spot
check in the default locale read clean. `tr-TR` is the row that cannot pass by
accident: the percent sign is on the other side of the number, which a reader
does not parse as a spacing difference. This is the harm objectui#4576 already
measured and paid for once — the same number under two conventions, one line
above the other.

`minor` rather than `major` because all published packages here share one
`fixed` group and a `major` would drag the group off `@objectstack`'s major
(AGENTS.md, version alignment); the breaking semantics are stated above rather
than carried by the level. No exported signature changes: `useColumnSummary`'s
parameters and return shape are untouched, and `formatSummaryLabel` is private
to the module.
