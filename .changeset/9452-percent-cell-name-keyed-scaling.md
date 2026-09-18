---
'@object-ui/fields': minor
---

Take the percent cell's magnitude from the value, never from the column's name
(objectui#9452).

`PercentCellRenderer` branched on `field.name` before it looked at the value: a
`/progress|completion/` test decided that such a column already held percentage
POINTS, so it skipped `percentDisplayValue` — the declared single source of
truth for percent display scaling — on both halves of the cell. A stored `0.5`
therefore rendered `50%` in the record-header summary chip and `1%` in the list
cell, the same record showing two magnitudes in two places. The pattern was
unanchored and tested against the whole lowercased name, so it also matched on
substring: a column merely mentioning progress took the whole-percent path on
the strength of a word inside its name.

Both consumers of that branch are fixed together, because the number was only
half of it. The mini progress bar's fill took its magnitude from the same
predicate, and its non-matching arm was a LOCAL restatement of
`percentDisplayValue`'s own expression rather than a call to it — so one cell
carried two spellings of one rule plus a name test, and pre-fix a
`progress`-named column storing `0.5` drew a bar 0.5% wide beside the text
`1%`. The number now goes through `formatPercent` and the bar through
`percentDisplayValue`, which is the one rule the summary chip, `formatMeasure`,
the metric tile and the grid column summary already read.

**What decided it.** The question the filing card left open — whether such a
column stores a fraction or points — was settled by measurement rather than by
taste. Every first-party value below `1` in a `progress` / `completion`-named
percent column is fraction-intent: the schema catalog's own percent sample
stores `0.753` in a field named `progress`, and the inline editor is pinned on
a `completion` field whose stored `0.5` must show `50`. The percent EDIT widget
never consulted the name at all — it detects the whole-percent convention from
a declared `max` above `1` — so the editor and the cell disagreed on those very
fields. The genuinely whole-percent producers are declared by TYPE
(`type: 'progress'` with `min: 0` / `max: 100`) and store only `0` or integers
at or above `1`, where both rules agree by construction. The name test had no
producer that needed it and two that it misread.

**Migration.** A value strictly between `0` and `1` stored in a percent or
progress column now reads as a fraction everywhere, including columns named
`progress` or `completion`. A tenant that really stored sub-1 percentage points
in such a column will see those cells move by two orders of magnitude; the fix
is at the producer, by storing the fraction the column's other surfaces already
assume. Values of `0`, and every value at or above `1`, are byte-identical
before and after.
