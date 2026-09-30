---
'@object-ui/types': patch
---

`TableColumn.masked`'s documentation describes withheld columns: a column whose type is not known yet is drawn as the mask and carries the flag (objectui#10657, which folded objectui#10706).

The JSDoc said that the related list and `object-data-table` still draw a `password` /
`secret` field as text while their object definition is loading or after its read
failed, and that `object-grid` draws an untyped column's raw value on its host-fetched
path until its object schema arrives. Neither holds any more: each of the three producers
now draws such a column as the mask and sets the flag on it, and `object-grid` takes the
field types from a host that has them (`objectFields`). The JSDoc is rewritten to say so.
The pending objectui#10657 `@object-ui/types` changeset says these docs state what that
window does not cover; once this change ships with it, they state what it withholds
instead. No type or schema shape changes.
