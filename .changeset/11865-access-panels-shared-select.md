---
'@object-ui/app-shell': patch
---

Studio's Access pillar picks with the shared `Select` in two more places: the package's record sharing overview (each object's internal and external sharing model) and a permission set's advanced facets (a row-level security policy's operation and a tab's visibility). They are the control Studio's object Settings tab already picks the same sharing models with (objectui#11865, the access panels part of that card).

The four pickers were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. In the sharing overview, each option leaves the row with the same working value as before, so Save sends the same object draft: "not set" still drops the key. In the facets, each option writes the same draft as before: an operation sets that policy's `operation`, and a visibility sets that tab's entry. Re-picking the current option writes nothing. None of the four native selects had a label, and the new triggers have none either.

On a read-only permission set the two facet pickers are disabled and wear the shared control's own disabled look (objectui#11781). A read-only package's sharing overview still shows each value as text, with no picker, as before.

One display change: a stored value that is not among a picker's options now shows that value. This happens, for example, with a policy operation the picker does not list. The native select showed its first option instead ("not set", "all" or "Visible"), which is not what the metadata says.

**Clause-②: no.** No published face moves: `PackageOwdOverviewPanel` and `PermissionAdvancedFacets` take the same props, the package entry exports the same names, and no i18n key is added. What moves is the two panels' own markup, described above.
