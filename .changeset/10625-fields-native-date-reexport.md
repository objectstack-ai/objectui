---
"@object-ui/fields": patch
---

The native date/time control adapters (`toDateInputValue`, `toDateTimeInputValue`, `fromDateTimeInputValue`) now live in `@object-ui/core`, and `@object-ui/fields` re-exports them unchanged (objectui#10625). Imports from `@object-ui/fields` keep working and name the same functions, and the date widgets behave as before.
