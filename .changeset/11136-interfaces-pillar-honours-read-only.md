---
'@object-ui/app-shell': patch
---

fix(app-shell): Studio's Interfaces pillar hands its page inspectors, canvas and source editor the package's real read-only flag

On a read-only package (a source-loaded package, `writable: false`) the
Interfaces pillar hid its nav "Edit" toggle and blocked both of its autosaves,
but the editors it opens for a nav leaf ignored the flag:

- The block inspector and the default inspector (for a page, its block
  properties and its page form) were created with a hardcoded
  `readOnly={false}`, so an edit took on screen and was silently discarded.
  Both now receive the pillar's real flag, the way the Data pillar
  (objectui#2259) and the Automations pillar (objectui#11124) thread it, and a
  page's inspector inputs render disabled or read-only.
- The canvas was handed the pillar's `onPatch`, so adding, dragging, renaming
  and deleting blocks or widgets all took locally and were then thrown away.
  On a read-only package it now gets no `onPatch`, which the preview contract
  reads as read-only; selecting a block or widget still opens the inspector,
  read-only.
- A source page's code editor, which is the right rail's editor for an
  `html` or `react` page, now receives the same flag and renders read-only.

On a writable package all of these still edit and autosave as before.
