---
"@object-ui/plugin-detail": patch
---

The detail page's inline date editor no longer blanks a stored day that does not exist without saying so (objectui#10625). A `date` field holding `2026-02-30`, or a `datetime` field holding `2026-02-30T10:00:00Z`, used to open an empty date input with no marker and no notice. The inline editor now uses `@object-ui/fields`' `DateField` for `date` and `datetime` fields, so it behaves like the form editor: the control is empty, marked `aria-invalid`, and described by a notice that names the stored value. Nothing is written until the user picks a day. A real date opens and saves as before (the edit is re-emitted as a full ISO timestamp at local midnight).
