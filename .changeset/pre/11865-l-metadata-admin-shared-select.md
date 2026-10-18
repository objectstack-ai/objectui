---
'@object-ui/app-shell': patch
---

Four metadata-admin pickers use the shared `Select`, the control the rest of the console picks with (objectui#11865, the metadata-admin previews and inspectors' part of that card): a record page preview's sample-record picker (`PagePreview`), a doc's book-section picker (`DocPreview`), the select-param mock in an action's input-dialog preview (`ActionPreview`), and the object designer's access posture (`ObjectDefaultInspector`).

The four were browser-native selects, so they looked and behaved differently from the console's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour. The book-section picker keeps one heading per book as a group of the dropdown. The action preview's mock now matches the dialog it previews, whose select field is the same primitive.

What they write is unchanged. Each sample record binds the same record as before. Each book section writes the same `group`, and "Not placed in a section" still removes the key; a section key that two books share writes that key from either book. Each posture writes the same `access` patch: "Private" sets `access.default` to `private`, and "Public" clears `access`. Re-picking the shown option writes nothing. The action preview's mock stays disabled and writes nothing. The book-section picker keeps the name its label gave the native select ("Book section"), and read-only mode still disables it and the posture picker, now in the shared control's own disabled look. The sample-record picker, the posture picker and the mock had no accessible name before and have none now.

One display change: while the book list loads, or when it cannot be read, a doc already placed in a section shows that section's key. The native select showed "Not placed in a section" instead, which is not what the doc holds.

`ViewVariantInspector` and `ReportDefaultInspector` already picked through the shared `Select`; only a code comment in each named a native select, and it now names the picker.

**Clause-②: no.** No published face moves: the package entry exports the same names, the four components take the same props, and no i18n key is added. What moves is the four controls' own markup, described above.
