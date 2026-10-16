---
'@object-ui/plugin-view': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-grid': patch
---

Four plugin controls pick with the shared `Select`, the control the rest of the console picks with (objectui#11865, the plugins' single selects): `SharedViewLink`'s "Expires after", `ViewSettingsPopover`'s "Color by field", a `select` field of the kanban `InlineQuickAdd` form, and the grouped grid's "Rows per page".

The four were browser-native selects, so they looked and behaved differently from the console's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour. The grouped grid's size picker is now drawn as the flat grid's pager draws its own.

What they write is unchanged. Each option gives the same value as before: "Never" still generates a link with no expiry, "None" still clears the row-colour config, the quick-add placeholder still submits an empty string, and each page size still repaginates from page 1. Re-picking the current option writes nothing. The quick-add picker keeps the accessible name its label gave the native select and still takes the form's first focus. Its keys keep the form's contract: Enter on the closed picker still submits the form and Escape still cancels it; Space and the arrow keys open the list, and Enter or Escape inside the open list selects or closes it without submitting or cancelling the form.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option instead ("None" for a row-colour field, the placeholder for a quick-add value), which is not what the view or the form holds.

**Clause-②: no.** No published face moves: the package entries export the same names, the four components take the same props, and no i18n key is added. What moves is the four controls' own markup, described above.
