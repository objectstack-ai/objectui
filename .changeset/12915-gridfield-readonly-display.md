---
'@object-ui/fields': patch
---

A read-only `GridField` table shows a select cell's option label and a number or currency cell in the session's locale (objectui#12915).

The read-only table (a read-only record page, a print page, a read-only master-detail grid) sent only file and date / datetime / time cells through the grid's display formatter and printed every other cell as its stored value: a status read `open` instead of `Open`, and an amount read `98765.25` instead of `98.765,25 €` in a `de-DE` session. Every cell except a lookup now goes through the same formatter the list-mode and computed cells already use, so the read-only and editable views of one row read alike. Since objectui#12854 a `record:line_items` column listed by `name` takes its select, number or currency type from the child field, so a read-only invoice's line items reach exactly these cells.

Lookup cells still render through `LookupField`, and file and date cells are unchanged.

Clause-②: no
