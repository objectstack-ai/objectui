---
'@object-ui/types': minor
'@object-ui/components': minor
---

`ui:calendar`: the selection shape follows `mode` (objectui#10304).

- `@object-ui/types`: `CalendarSchema.value` / `.defaultValue` (and the `UiCalendarSchema` mirror) now admit one day, a list of days, or a `{ from, to }` range, where a day is an ISO 8601 date string or a `Date`. The zod mirror pairs each shape with its mode: `single` (the default) takes one day, `multiple` a list, `range` a `{ from, to }` object with `to` optional and no other key. Breaking for documents that validated before: a single day under `mode: 'multiple'` or `mode: 'range'` is now refused at the key, where it used to pass validation and then crash the node (`multiple`) or select nothing (`range`).
- `@object-ui/components`: the `ui:calendar` renderer reads each mode's shape and coerces every day in it through `toDisplayDate`, so date-only strings in a list or a range select the days they name in every time zone. A range now selects its days. A value whose shape does not fit its mode selects nothing instead of throwing, and is not reshaped.
