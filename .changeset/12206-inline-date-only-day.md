---
'@object-ui/plugin-detail': patch
---

An inline edit of a date-only field on a record page saves the day the user picked, in every timezone (objectui#12206).

The inline editor in the record highlights and the details body wrote a `date` field as local midnight converted to a UTC instant. The server keeps a date-only field's UTC calendar day, so every user east of UTC saved the day before: at UTC+8, picking 2026-10-16 sent `2026-10-15T16:00:00.000Z` and stored 2026-10-15. The editor now writes the picked day as the plain `YYYY-MM-DD`, as the Edit form already did.

A `datetime` field edited inline is unchanged. No export, prop or type changes.
