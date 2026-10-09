---
'@object-ui/console': patch
---

The approvals inbox's request drawer shows its record summary the way the record page shows the record (objectui#11677).

The summary card now reads the field declarations of the request's object. It asks the same cached metadata read the drawer already makes for `hidden: true`, so no network request is added. With those declarations:

- **Labels.** Each row takes its field's declared label, translated as the record page translates it, instead of the server's snapshot label or a title-cased key.
- **Values.** Each value is drawn by the record page's own cell for its field type. An option shows its label (`Sent`, `EMEA` instead of `sent`, `emea`), a date shows as the date cell shows it, and a currency field shows in its currency. A lookup still shows the record title the server resolved. The lead amount at the top of the card follows the same rule. A `summary` roll-up shows as the record page shows it: the plain stored number, without digit grouping.
- **Rows.** A snapshot key the object does not declare gets no row. Neither does a reference the server could not resolve to a title, because its value is an id.

If the object's metadata cannot be read, the card renders the snapshot as before.

Two rows never share a label. The card now drops the platform's injected ownership column `owner_id` (label "Owner") as bookkeeping, the same way the default list columns do, so an object that also declares its own `owner` field no longer shows two "Owner" rows. If two remaining fields still share a label, each of those rows adds its field key in parentheses. The rows are keyed by field key rather than by label, so React no longer warns about two children with the same key.
