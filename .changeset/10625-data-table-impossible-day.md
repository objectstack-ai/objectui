---
"@object-ui/components": patch
---

The data table's inline date editors no longer roll or silently blank a stored day that does not exist (objectui#10625). A `datetime` column holding `2026-02-30T10:00:00Z` used to open on 2 March, so an edit of only the minutes saved that day; a `date` column holding `2026-02-30` opened empty with no marker. Both editors now use the shared adapters from `@object-ui/core`, the same ones the form's date widgets use. For such a value the control is empty, marked `aria-invalid`, and described by a notice that names the stored value (the existing `fields.date.impossibleDay` and `fields.dateTime.impossibleDay` messages). Pressing Enter without an edit keeps the stored value as it was. Real dates open and save as before.
