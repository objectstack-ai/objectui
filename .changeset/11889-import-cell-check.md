---
'@object-ui/plugin-grid': patch
---

The Import Wizard preview marks a cell exactly where the server's import refuses it on dates, on rating, slider, progress and toggle columns, and on email columns, so the import button counts the rows the import will write (objectui#11889, after objectui#11814).

- **Dates.** A `date` or `datetime` cell is read the way the server reads it: an ISO 8601 day or date-time, the export's `YYYY-MM-DD HH:mm:ss`, or a year-first date such as `2026/7/15`, on a day that exists and in a supported year. `07/15/2026`, `July 15, 2026` and `1/2/26` are now marked "is not a valid date", as the server refuses them. Before, any text the browser's date parser read was taken.
- **Rating, slider, progress and toggle.** The preview now checks the types the server coerces as numbers and as true/false values, read from `@objectstack/spec`'s `NUMERIC_VALUE_TYPES` and `BOOLEAN_VALUE_TYPES`. So `abc` in a progress column and `maybe` in a toggle column are marked, and `3` and `yes` are taken.
- **Email.** An email cell is checked by the server's record rule, which takes an address with a non-ASCII domain such as `735431496@柴仟.com`. The preview no longer marks it, and still marks an address like `a@b`.

Nothing is added to the package entry: no export, prop or accepted input changes, and the sentences are the existing ones.
