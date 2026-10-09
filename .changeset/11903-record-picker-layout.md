---
'@object-ui/fields': patch
'@object-ui/console': patch
---

The record picker (`RecordPickerDialog`) is laid out from the design system's own primitives (objectui#11903). It is the dialog behind a multi-select lookup's "Browse all records", a related list's Add and a role's Assign user.

- **Spacing.** The dialog keeps the standard spacing between its title, search, table and footer. The title no longer sits on the search box.
- **Search.** The search box is the standard input with a leading icon: one border at rest, one focus ring.
- **Selection.** In multi-select mode every row starts with a checkbox that shows whether it is picked, and the header checkbox picks or clears every row on the page. A row click, the arrow keys and Enter / Space toggle a row as before.
- **Width.** The dialog is as wide as its columns need: a three-column picker is no longer stretched to the full large-screen width, which stays the ceiling for wide pickers.
- **Footer.** The record count, the page controls, the selected count and the Cancel / Confirm buttons sit on one footer bar.
- **Confirm.** Confirm is disabled while nothing is picked.
- **No links in rows.** Email, URL, phone, file and reference values show as text inside the picker, so a click on a row always picks it instead of opening a mail client or another record.

The console's dev-only preview gallery shows the picker in multi-select mode over three columns (`?only=record_picker`). Nothing is added to the package entry: no export, prop, type member or language-pack key.
