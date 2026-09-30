---
'@object-ui/fields': minor
---

`MaskedCellRenderer`, the mask a `password` / `secret` cell draws, is now exported, so a table that cannot type a column yet draws it WITHHELD instead of as text (objectui#10657, which folded objectui#10706).

**New export `MaskedCellRenderer`.** It is the component the standard `password` and
`secret` cells already resolve to: `••••••` for a value that is set, the empty-value mark
for one that is not. Its `field` prop is optional, because it reads only whether a value
is present. It is the shipped mask, not whatever is registered for `password` at the
time, so a host override of a masked type does not change what a withheld cell draws.

`object-grid`, the related list and `object-data-table` use it for a column whose type is
not known yet: while the object's field types are loading, or after their read failed,
they draw such a column as this mask rather than as its value.

`registerFieldRenderer('api_token', MaskedCellRenderer)` now masks a type the same way
the `getCellRenderer('password')` form does, and `isMaskedFieldType('api_token')` answers
`true` for it. Nothing that already resolves changes.
