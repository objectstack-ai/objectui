---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

fix(fields): the editable date-time faces no longer roll a stored impossible day into a real one

`toDateTimeInputValue` let a `Z`, offset or date-only spelling fall through to
`new Date(...)`, which accepts a day of 01-31 for every month and rolls the
surplus forward: a stored `2026-02-30T10:00:00Z` reached the `datetime-local`
control as `2026-03-02T10:00`, and an edit could save that day back. The read
faces already refuse such a value (objectui#10026, objectui#10301).

The adapter now asks the same judgement (`isRealCalendarDate`) of the day AS
WRITTEN, before any conversion, in every spelling, and `fromDateTimeInputValue`
never re-emits a nonexistent day as a rolled one. A `datetime-local` control can
paint a nonexistent day only blank (measured in Chromium), so the editable
`DateTimeField` and the sub-grid's editable `datetime` cell leave the control
empty, mark it `aria-invalid`, and name the stored string beside it with the new
`fields.dateTime.impossibleDay` sentence (all ten packs). Nothing is written until
the user picks a new value; a real date-time and a zone-less value behave as before.
