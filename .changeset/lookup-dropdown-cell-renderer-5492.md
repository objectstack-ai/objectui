---
'@object-ui/fields': patch
---

A lookup's inline dropdown renders its columns through the same cell renderer the browse-all picker uses, so one `lookup_columns` declaration cannot produce two answers.

A form's lookup field offers two ways to pick a related record, and both read
the same declaration: the inline dropdown under the field, and the
"browse all records" picker behind it. The picker resolved every cell through
the type-aware cell renderer. The dropdown did not — it printed
`record[descriptionField]` verbatim into the option subtitle and concatenated
`label: String(rawValue)` into the row's `title` attribute. Measured on the
same declaration, on a real 17.1.0 deployment:

```
column          inline dropdown (before)          browse-all picker
lookup          T5MsMCuwP4t_yUHq (bare FK id)     the related record's name
date            2026-08-20T00:00:00.000Z (ISO)    a formatted date
select          pending (enum code)               the authored option label
```

Both surfaces now call one shared module — `widgets/lookupColumnDisplay.tsx`,
which owns column normalisation, the field-descriptor enrichment from the
referenced object's schema, and the render itself. The picker's own
`renderCellContent` and `columnFieldDescriptors` are now thin calls into it, so
there is a single renderer left to drift from. The dropdown's extra columns are
rendered into the option row itself; the row's `title` keeps the full option
label, which is what a truncated label needs, instead of a raw-value dump.

This change touched no query and widened no contract. `lookupColumns` entries
stay bare field names — no dot paths, no populate/expand semantics — because
at the time neither surface's request carried populate: the picker resolved a
foreign-key id to a name client-side, in the lookup cell renderer, and the
dropdown inherited exactly that. A later change (objectui#10223) has both
requests ask for `$expand` on the reference columns they display, minus any
the loaded permission policy denies, and another (objectui#10373) stops both
surfaces from drawing a column that policy denies or showing a field it denies
in a record's title. A readable value that still arrives as a bare id is
resolved by that same cell renderer. An unresolved reference therefore renders
what the picker renders for it, and keeps its column: among the columns the
policy lets the user read, a slot is dropped only when the record holds no
value for the field, decided on the raw value and never on what the renderer
makes of it, so an unresolved id can never degrade into a silently empty
column.
