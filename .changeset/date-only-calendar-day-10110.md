---
'@object-ui/core': patch
---

fix(core): a date-only value renders the calendar day it names, in every viewer timezone

`formatDate` / `formatRelativeDate` / `formatDateTime` parsed every string value
with `new Date(value)`. ECMAScript reads the two ISO shapes in two different
zones — a date-only form is UTC, a date-time form without an offset is local —
so `2026-08-01` became UTC midnight and was then read back through this module's
LOCAL getters. West of UTC that is the previous calendar day: a `date` field
storing `2026-08-01` rendered `7月31日` for a UTC-7 viewer while the stored
value, the API response and a UTC+8 viewer all said August 1st. The relative
branch shifted with it, one day per day (`2026-08-31` read `4天前` on the 3rd).

A date-only value names a calendar day and carries no instant, so there is no
conversion to perform: it is now rebuilt at LOCAL midnight of the day it names,
and every getter downstream reports that day in every zone. Nothing adds or
subtracts hours — an offset that cancelled the shift would be wrong again at a
DST boundary and wrong in the other direction east of UTC, where the old parse
already landed on the right day. A value carrying a time is untouched: it HAS an
instant, and rendering an instant in the viewer's zone is what a `datetime` is
for. What the path accepts is unchanged by this fix. (A well-shaped impossible
day such as `2026-02-30`, which the engine rolls into March, is now refused by
the same path — objectui#10026, a separate entry in this release.)

Every caller that hands these functions the wire string moves with the fix —
the `date` cell and its readonly field face, `ObjectGrid`'s date columns and
mobile cards, `ObjectGantt`'s tooltips, `FormulaField`, lookup column display,
and dataset date measures.
