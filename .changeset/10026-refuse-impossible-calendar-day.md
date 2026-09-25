---
'@object-ui/core': minor
'@object-ui/components': patch
'@object-ui/fields': patch
---

fix(core): the shared date path refuses a calendar day that does not exist, with the marker it already renders for an unparsable value

A date-only value naming a day its month does not have — `2026-02-30`, `2024-02-31`, `2025-02-29` — used to render as a real, different day on every date face: the engine's parse accepts a day of `01`-`31` for any month and rolls the surplus forward, so `2026-02-30` showed as `Mar 2`, with nothing to say the stored value was wrong. The filter builder already refused the same value at the authoring boundary, so the repo gave one concept two answers.

- **New export `isRealCalendarDate(dateOnly)` from `@object-ui/core`.** It moved from `@object-ui/components`' filter builder, which now imports it — one implementation, shared by the authoring boundary and the display path. It answers `true` only for a `YYYY-MM-DD` string whose year, month and day exist. It now also reads a year below 100 as that year (it used to answer `false` for `0026-08-01`), so the filter builder keeps such a date instead of clearing it.
- **`toDisplayDate` returns an Invalid Date for such a value**, so `formatDate` (every face: default, `short`, `relative`), `formatRelativeDate` and `formatDateTime` render `—`, and `formatDateTimeCompactParts` returns `null` — each function's existing answer for an unparsable value. A caller that reads `toDisplayDate` directly gets the same refusal and shows its own unparsable face: the History tab and the record summary chip now show the stored string instead of a rolled date.
- **A dataset measure agrees with the list cell on the refusal.** A date-only measure value of `2024-02-30` renders `—`, the same as the `date` cell beside it. The measure takes that answer from the shared path and makes no judgement of its own.
- **`@object-ui/fields`:** the `date` and `datetime` cells, the readonly `DateField` and a date-returning `FormulaField` show the shared "No value" placeholder for such a day, exactly as for an unparsable value, instead of a bare dash.

This change covers date-only values only. (A value that carries a time, such as `2026-02-30T10:00:00Z`, is refused by the same path too — objectui#10301, a separate entry in this release.)
