---
'@object-ui/plugin-form': patch
---

A form section that declares no `columns` now draws two fields per row from the container's `@md` width (one below it) on every page form host — `ObjectForm`, `SplitForm`, `TabbedForm` and `WizardForm` — as the record dialog already did (objectui#12592). Before this, `ObjectForm` sized it by field count and the other three drew it one per row, or at the widest declared count. `@objectstack/spec` no longer defaults a section's `columns` to `1`, so this reaches every section an author left undeclared, a field-group section included. The rule lives once, in the shared sectioned-form layout, and a declared `columns` (`1` included) is drawn as written.

Clause-② reading: no. Only how many columns an undeclared section draws changes; no published type, prop, export, schema read or pack key changes, and the ruling on objectui#12521 makes an undeclared density the renderer's choice by available width.
