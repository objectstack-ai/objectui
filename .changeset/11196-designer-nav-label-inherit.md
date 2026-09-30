---
'@object-ui/app-shell': patch
'@object-ui/plugin-designer': patch
---

fix(app-shell,plugin-designer): the designer's nav surfaces name a nav entry with no `label` the way the console draws it (objectui#11196)

A navigation entry's `label` is optional: an entry without one shows, at render time, the current
label of what it opens. The console's sidebar, `nav:menu`, command palette and search already draw
it that way, and the platform now writes such entries (the console's navigation sync, for every
page and dashboard). The designer surfaces read the raw label instead, so the same entry showed as
`(unnamed)` in the app preview, as a positional `Item N` card on the nav canvas, by its positional
selection id in the app nav inspector, by its target's internal name (or, for a group, a blank
heading) in the Studio Interfaces rail, and as a blank row in the Navigation Designer and the app
wizard's Navigation step.

Every one of those surfaces now asks the runtime's own rule, `resolveNavItemLabel` from
`@object-ui/layout`; none keeps a second copy of it. In app-shell the preview, the canvas, the
inspector and the Studio rail pass the console's own target resolver, so a label-less entry shows its target's current
label (a rename shows on the next render), else the target's machine name, else the entry's `id`.
The app wizard's Navigation step hands the rule its own object list, so a label-less object entry
there shows the object's label. The Navigation Designer is handed bare items and no metadata, so it
shows the rule's machine-name rung (`pageName`, `dashboardName`, `objectName`, …), which is what the
console shows for a page.

Editing keeps inheritance intact. The canvas's inline rename and the inspector's Label field show
the inherited text as a placeholder, never as a stored value: leaving an entry untouched keeps it
label-less, and typing writes an author label. Emptying the inspector's Label field restores
inheritance by removing the `label` key, never by writing `''`; for a locale-map label it drops only
the designer locale's own entry. The inspector also stops reading `title` and `name`, which are not
nav-item keys, as the label, and a locale-map label there now shows its text instead of
`[object Object]` and keeps every other language when edited.

`@object-ui/plugin-designer` now depends on `@object-ui/layout`, which it did not before.
