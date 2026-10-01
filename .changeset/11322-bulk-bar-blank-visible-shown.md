---
'@object-ui/plugin-grid': patch
---

A bulk action whose `visible` is blank now shows on the grid's selection bar and runs over every selected
record, as it already does on the row menu and the toolbars of the same grid (objectui#11322).

The selection bar decided whether a bulk action "declared a visibility gate" with a test of its own,
`!= null && !== ''`, and handed the value to the shared fold, whose opening test also stops at `''`. A
whitespace-only `visible` (`'   '`), or an envelope whose `source` is blank
(`{ dialect: 'cel', source: '   ' }`), therefore counted as a gate: every selected record failed it and
the button disappeared, while the row menu and the toolbars, which ask the action family's one
definition, showed the same action. `hasVisibilityGate` now asks that definition,
`hasDeclaredVisibilityGate`, and `partitionBulkRows` asks it before handing a def's `visible` to the fold.
So blank text in either spelling and the empty envelope are "no gate" here too, and the blank is reported
once as on the other surfaces. An envelope with an `ast` and no `source` is no gate here either, as on
the row menu, where the bar used to evaluate it, fail closed and hide the button. `visible: false` is
unchanged: it is still a declared gate that hides the button.

The built-in Delete is unchanged. Its `userActions.delete.visibleWhen` is a field-rule key, not an
action's `visible`, so `ObjectGrid` now hands it to the fold directly, as plugin-list's `ListView` does.
A blank one still excludes every selected record.
