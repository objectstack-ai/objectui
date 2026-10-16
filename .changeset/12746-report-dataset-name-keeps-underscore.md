---
'@object-ui/app-shell': patch
---

A new report's or dataset's Name keeps every underscore you type (objectui#12746). The report and dataset designers' Name box normalized each keystroke with the strict identifier rule, which drops a trailing `_` before the next key arrives. So `qavrf_rev` typed key by key read `qavrfrev`, and a report or dataset in a namespaced package could not get its namespace prefix by typing. Clearing the box also wrote `field` back into it, so a Name could not be retyped from empty.

Both designers now commit Name with the prefix-stable form the object designer already uses: what you type is lowercased, and runs of other characters become a single `_`, but a trailing `_` stays until the next key. A cleared box stays empty, and the Name then follows the Label again. A Name derived from the Label still uses the strict form, so a Label typed with a trailing space or punctuation never leaves a trailing `_` in the Name. The spec's identifier rule still judges the name, as before. An existing report's or dataset's name is unchanged and still not editable.

Nothing is added to or removed from the package entry: no export, prop or type changes.
