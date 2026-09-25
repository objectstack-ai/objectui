---
'@object-ui/components': patch
---

`ui:calendar`: the designer no longer offers `mode: 'default'` (objectui#10377). `CalendarSchema.mode` and the `UiCalendarSchema` mirror admit only `single`, `multiple` and `range`, so a document authored with `default` was refused on save; react-day-picker 10 has no such mode either, and under it the calendar dropped the authored selection and ignored clicks. The registration `inputs` enum now lists exactly the contract's modes.
