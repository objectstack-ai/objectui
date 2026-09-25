---
'@object-ui/fields': patch
'@object-ui/i18n': patch
---

fix(fields): the editable date-only faces no longer blank a stored impossible day silently

`toDateInputValue` keeps a stored `2026-02-30` as written and never rolls it,
but an `<input type="date">` sanitises a day that does not exist to an empty
value (measured in Chromium). So `DateField` and the sub-grid's editable `date`
cell showed an empty control with no marker for a value that was stored. That
is a silent blank, which the direction of objectui#10026 rules out, and it is
the date-only half of objectui#10474.

Both faces now judge the day as written with `isImpossibleStoredDay` (the check
objectui#10474 added). For such a day they hand the control an empty value,
mark it `aria-invalid`, and name the stored string beside it with the new
date-only sentence `fields.date.impossibleDay`, in all ten packs. The control's
`aria-describedby` points at that sentence. Nothing is written until the user
picks a new day, and picking a real day clears the marker. Real days and empty
values render as before.
