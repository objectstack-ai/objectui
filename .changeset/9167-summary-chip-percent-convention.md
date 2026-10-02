---
'@object-ui/plugin-detail': patch
---

The `summaryFields` chip beside the record H1 takes the percent CONVENTION from
the same place it already takes the scaling (objectui#9167).

`percentDisplayValue` in `@object-ui/core` states the rule in its own doc
comment: a third surface that needs percent display takes BOTH halves from there
— the scaling AND the convention — "or this promise breaks again in the same
place". objectui#9071 moved this chip onto the scaling and deliberately stopped,
so the chip went on appending a bare `%` to the full JavaScript number while the
list cell (`formatPercent` through `PercentCellRenderer`) rounded to the field's
declared precision — `0` by default — and rendered through the locale's own
percent affix. One stored value, one field, two readings in two places.

The chip's text is now `formatPercent(stored, precision, locale)` — the list
cell's own call, with the field's declared precision resolved view-over-object
and the session locale from `useDisplayLocale()`. Nothing rounds or appends a
sign locally; that is the shape objectui#9071 deleted.

**This changes what the chip prints, which is the point of the card.** Measured
by driving both surfaces in the same run, on the same field, from the same
stored value — every value that moves, moves onto the reading the list cell was
already giving:

| stored   | locale  | chip before | chip after  | list cell (unchanged) |
|----------|---------|-------------|-------------|-----------------------|
| `0.123`  | `en`    | `12.3%`     | `12%`       | `12%`                 |
| `12.3`   | `en`    | `12.3%`     | `12%`       | `12%`                 |
| `1.5`    | `en`    | `1.5%`      | `2%`        | `2%`                  |
| `1.005`  | `en`    | `1.005%`    | `1%`        | `1%`                  |
| `1234.5` | `en`    | `1234.5%`   | `1,235%`    | `1,235%`              |
| `0.25`   | `de-DE` | `25%`       | `25 %`      | `25 %`                |
| `1234.5` | `de-DE` | `1234.5%`   | `1.235 %`   | `1.235 %`             |
| `0.25`   | `tr-TR` | `25%`       | `%25`       | `%25`                 |

Values already spelled the same in both places do not move: `0.25`, `0`, `1`,
`250`, `-5` in `en` read exactly as before. A field that declares
`precision: 2` now reaches the chip as well — a stored `1234.5` reads
`1,234.50%` in both places.

The chip's BAR is untouched: it keeps drawing the unrounded magnitude, because
the list cell's bar does too.

⚠️ **Dated note, 2026-10-02 — the magnitude guess is retired in this same release — objectui#11475.**
Later in this same release `percentDisplayValue` (`@object-ui/core`) stopped
inferring a percentage's storage from the value: it takes the storage as a
required argument, and every percent face passes the storage the field
declares (`percentScaleOf` in `@objectstack/spec/data`: a fraction unless the
field declares a `max` above 1). So the chip scales at its field's declared storage, and a stored value in the
table above reads as written only on a field whose storage matches the
magnitude the old guess assumed for it. The rest of this entry is kept as the reading of this change.
