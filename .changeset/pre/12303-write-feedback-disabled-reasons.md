---
'@object-ui/app-shell': patch
'@object-ui/plugin-grid': patch
'@object-ui/i18n': minor
---

Console writes that landed in silence now say so, and controls disabled on a read-only package say why to every user, not only to a mouse (objectui#12303).

- **The grid's inline-edit saves raise a success toast.** "Save All" and the per-row save of a grid with no host save handler now show the console's shared toast, naming how many rows were saved ("1 row saved", "2 rows saved"). Only rows the server accepted are counted: a row that is refused stays pending and flagged as before, and a save where nothing landed shows no success toast.
- **"Discard draft" on the metadata edit page raises a success toast** naming what was discarded ("Draft discarded: object/NAME"). A refused discard keeps showing its error instead.
- **Studio on a read-only package:** the header's Publish, the automation enable switch and the Data pillar's Field properties rail now carry the read-only reason the way the record page's disabled actions do. A focusable wrapper is the tooltip trigger and a tab stop, and the reason is the control's accessible description. Before, the reason was a `title` on a disabled control (Publish, the switch) or absent (the rail), so Tab skipped it and assistive tech never heard it.
- **The import wizard's disabled "Next"** is described by the visible "Can't continue" text that says which required fields are not mapped, and a focusable wrapper puts it in the tab order.
- **Studio's lookup rail reads label first.** The field pickers (Display field and the other searchable pickers in the inspectors) list each option by its label, with the machine name after it, smaller and in monospace, and show a chosen option the same way. The object picker (Related object) shows a chosen object's label while it is not being edited, with the machine name beneath it.

**Clause-②: yes (widening)** — every locale pack gains the `table.saved` count family (`table.saved`, plus each pack's plural forms), the grid's save toast. Nothing is renamed or removed.
