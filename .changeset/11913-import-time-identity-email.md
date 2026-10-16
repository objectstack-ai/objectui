---
'@object-ui/plugin-grid': minor
'@object-ui/i18n': minor
'@object-ui/app-shell': patch
---

The Import Wizard's preview checks a `time` column, and the user import's email column, the way the server's import judges them, so the import button no longer counts rows the server then refuses (objectui#11913).

- **A `time` column is checked.** A cell is marked where the server's `parseDateCell` reads no time of day from it and the import refuses it with `invalid_time`. The server takes a wall clock (`10:00`, `09:30:15`), an ISO 8601 day or date-time (stored as its UTC time of day) and a year-first date. It refuses `25:00`, `abc`, `10:00Z` and `9am`, and the preview now marks them with the sentence `"{{value}}" is not a valid time` (in English). An `invalid_time` row error from the server's dry run (Validate data) is shown with the same sentence.
- **The user import's email column is checked by the user import endpoint's rule.** That endpoint refuses an address that is not printable ASCII, is longer than 254 characters, or sits on the placeholder domain, with `INVALID_EMAIL`. The column used to reach the wizard typed as text, so the preview checked nothing there. It is now typed `email` and checked by that rule instead of the record validator's. The two rules differ both ways: the record rule takes a non-ASCII domain such as `735431496@柴仟.com`, and the endpoint's rule takes `a@b..c`.

Additions to the published surface:

- `@object-ui/plugin-grid`: `ImportWizardProps['fields'][number]` gains an optional `emailRule?: 'identity'`. Left out, an `email` column is checked by the record validator's rule, as before. Set to `'identity'`, it is checked by the user import endpoint's rule.
- `@object-ui/i18n`: every language pack gains `grid.import.invalidTime`, with a `{{value}}` placeholder.
