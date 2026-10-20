---
'@object-ui/plugin-grid': patch
---

The bulk-action confirm step names each affected record by the object's declared `nameField`, even when no column of the view shows it, and never by another text field (objectui#13107).

- **The grid asks for the declared `nameField`.** A grid that runs its own query (a standalone `object-grid`, or a grouped grid that groups on the server) now puts the object's `nameField` in its `$select`, a formula field included. It is fetched, not drawn: no column is added. It passes the same two checks as the grid's other extra fields: the object must declare it, and the viewer must be allowed to read it.
- **No other field stands in for the declared name.** For an object that declares a `nameField`, a row without that value is listed as `Record #ID`. Before, the step fell through to a guessed field: on a contact list whose columns were first name, last name and job title, it listed the contacts' job titles. Objects that declare no `nameField` are named as before.

Nothing is added to the package entry: no export, prop or type member.
