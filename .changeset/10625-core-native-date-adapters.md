---
"@object-ui/core": patch
---

`@object-ui/core` now exports the native date/time control adapters `toDateInputValue`, `toDateTimeInputValue`, `fromDateTimeInputValue` and `isImpossibleStoredDay` (objectui#10625). They moved down from `@object-ui/fields` unchanged, next to `isRealCalendarDate`, so the data table in `@object-ui/components` can use the same set instead of private copies. Their behaviour is unchanged: a stored day that does not exist (such as `2026-02-30`) is never rolled to a real one.
