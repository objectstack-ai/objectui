---
'@object-ui/plugin-grid': patch
---

A bulk action whose `visible` is blank now shows on the grid's selection bar, as it already does on the
row menu and the toolbars of the same grid (objectui#11322).

The selection bar decided whether a bulk action "declared a visibility gate" with a test of its own,
`!= null && !== ''`. A whitespace-only `visible` (`'   '`), or an envelope whose `source` is blank
(`{ dialect: 'cel', source: '   ' }`), therefore counted as a gate: every selected record failed it and
the button disappeared, while the row menu and the toolbars, which ask the action family's one
definition, showed the same action. `hasVisibilityGate` now asks that definition,
`hasDeclaredVisibilityGate`, so blank text in either spelling and the empty envelope are "no gate" here
too, and the blank is reported once as it is on the other surfaces. `visible: false` is unchanged: it is
still a declared gate that hides the button.
