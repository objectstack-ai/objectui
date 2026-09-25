---
'@object-ui/core': patch
'@object-ui/fields': patch
---

fix(core,fields): a date-time written on a calendar day that does not exist is refused, not rolled into another day

`2026-02-30T10:00:00Z` names a day February does not have. The engine parses it anyway and rolls the surplus forward, so it rendered as `Mar 2, 2026, 10:00 AM`: a real day nobody wrote, with nothing to say the stored value was wrong. objectui#10026 made the shared date path refuse such a day on a date-only value; this extends the same refusal to a value that carries a time.

- **`toDisplayDate` returns an Invalid Date for an ISO date-time whose leading `YYYY-MM-DD` is not a real calendar day** (the `isRealCalendarDate` judgement). The day is read from the stored string as written, so a real day written with an offset — `2026-02-28T23:30:00-05:00`, which is March 1st in UTC — is not refused, and a real date-time renders exactly as before. `formatDateTime`, `formatDate` and `formatRelativeDate` render `—` for such a value, `formatDateTimeCompactParts` returns `null`, and a dataset measure over it renders the same `—`: each function's existing answer for an unparsable value.
- **`@object-ui/fields`:** the `datetime` and `date` cells, the readonly `date` widget and a date-returning `FormulaField` show the shared "No value" placeholder for such a value, and the readonly `datetime` widget shows `—`, exactly as each does for an unparsable value.
- **The sub-grid (`GridField` / `LineItemsField`) `date` and `datetime` columns read the shared parse step instead of building their own `Date`.** A value that step refuses shows the stored string, this surface's existing face for a value it cannot parse: an impossible day in either column (`2026-02-30`, which the `date` column still rolled into March after objectui#10026), and an out-of-range month (`2026-13-45`, which the `date` column rendered as `Feb 14, 2027`). A `date` value with a year below 100 (`0026-08-01`) now renders that year, as the `date` cell does, instead of 1926.
