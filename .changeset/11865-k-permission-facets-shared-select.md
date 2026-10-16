---
'@object-ui/app-shell': patch
---

A permission set's advanced facets pick with the shared `Select`, the control the rest of Studio picks with (objectui#11865, the facets' part of that card): a Row-Level Security policy's operation, and a tab's visibility under Tab Visibility.

The two pickers were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option gives the draft the same policy operation or tab visibility as before, and Save sends the same permission set. Re-picking the current option writes nothing. The native selects had no label, and the new triggers have none either. In a read-only permission set each trigger is disabled, as the native select was, and wears the shared `Select`'s own disabled look.

One display change: a stored operation or visibility that the picker does not offer now shows as itself, an empty one included. The native select showed its first option instead ("all" for an operation, "Visible" for a tab), which is not what the permission set holds.

**Clause-②: no.** No published face moves: `PermissionAdvancedFacets` is internal to the package and takes the same props, the package entry exports the same names, and no i18n key is added. What moves is the two controls' own markup, described above.
