---
'@object-ui/app-shell': patch
---

Studio's package record sharing overview picks each object's internal and external sharing model with the shared `Select`. That is the control Studio's object Settings tab already uses for the same two sharing models (objectui#11865, the overview's part of that card). A permission set's advanced facets keep their native selects for now: the shared `Select` adds bytes to the console's first load there, and the first-load budget has no room for them yet.

The overview's two dials were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option leaves the row with the same working value as before, so Save sends the same object draft, and "not set" still drops the key. Re-picking the current option changes nothing. The native selects had no label, and the new triggers have none either. A read-only package still shows each value as text, with no picker, as before.

One display change: a stored sharing model that neither dial offers now shows as itself. The native select showed "not set" instead, which is not what the object says.

**Clause-②: no.** No published face moves: `PackageOwdOverviewPanel` takes the same props, the package entry exports the same names, and no i18n key is added. What moves is the overview's own markup, described above.
