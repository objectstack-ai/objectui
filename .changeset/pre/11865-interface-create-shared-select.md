---
'@object-ui/app-shell': patch
---

Studio's Interfaces create dialog picks a new page's source kind, and a new report's dataset and measure, with the shared `Select`, the control the rest of Studio picks with (objectui#11865, the create dialog's part of that card).

The three pickers were browser-native selects, so they looked and behaved differently from Studio's other dropdowns. They now use the shared Radix `Select`: the same trigger, dropdown and keyboard behaviour.

What they write is unchanged. Each option gives the dialog the same value as before: the page kind is still `html` or `react`, "Choose a dataset…" still clears both the dataset and the measure, a dataset pick still clears the measure, and "Choose a measure…" still clears the measure. Re-picking the current option writes nothing. Each picker keeps the accessible name its label gave the native select ("Written in", "Dataset", "Measure"). The dialog has no read-only state: a read-only package offers no create entry, as before.

One display change: a value none of a picker's options carries now shows as itself. The native select showed its first option instead ("HTML", "Choose a dataset…" or "Choose a measure…"), which is not what the dialog would save.

**Clause-②: no.** No published face moves: the package entry exports the same names, the dialog's field components (internal to the package) take the same props, and no i18n key is added. What moves is the dialog's own markup, described above.
