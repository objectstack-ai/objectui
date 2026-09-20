---
'@object-ui/app-shell': patch
---

A grid/table repeater cell resolves its widget through the same chain a card row
does (objectui#9859).

`SchemaForm`'s five name-convention detectors — `detectFieldRefWidget`,
`detectSecretWidget`, `detectIconWidget`, `detectColorWidget`,
`detectConditionWidget` — were spelled out inline in `FieldRow`, so they were a
property of that row component rather than of the form engine. `RepeaterField`'s
grid/table layout deliberately does not go through `FieldRow` (a grid row has no
`<label>`; it names each cell from its column header by IDREF instead,
objectui#5063) and reached `FieldControl` with `inferWidget` alone. Every
detector was therefore skipped for every grid cell: the same property in the
same repeater resolved to two different faces depending on one layout flag, and
`detectSecretWidget` is one of the five — so a repeater that opted into
`widget: 'grid'` lost credential masking silently.

The chain is now one named function both layouts call, rather than a second copy
in the grid branch that would leave the next detector to be forgotten again. The
lift includes `resolveRegisteredWidget`, which is what turns a conditional widget
name into the registration that actually renders (objectui#4871) — `inferWidget`
alone already yields `color-picker` for a `type: 'color'` field, so a grid cell
that skipped it landed on the swatch `radiogroup` even where the free-colour
input was the right face.

No shipped form spec declares `widget: 'grid'` or `widget: 'table'` today, so no
live surface changes with this release; the asymmetry was latent.
