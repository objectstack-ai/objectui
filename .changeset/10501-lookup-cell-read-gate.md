---
'@object-ui/fields': patch
---

fix(fields): the lookup cell names the referenced record from the fields the viewer may read (objectui#10501)

`LookupCellRenderer` names the record a lookup points at through the referenced
object's schema: the column's `displayField`, then the object's `nameField`,
then its `titleFormat`, then the type-aware derivation. It did that on the row
as served. On a backend that does not strip the fields a permission policy
denies (ObjectStack's `FieldMasker` does strip them), a `titleFormat` or
`nameField` naming a denied field printed that field's value in every list,
grid and detail cell that shows the lookup. The lookup editor's option label
already applied the rule (objectui#10411), as does the record title
(objectui#10434).

The cell now resolves the name from the row with the fields the loaded policy
denies on the REFERENCED object removed; `id` and `_id` are kept. The name
falls through to the next source exactly as it does for the row a stripping
backend serves. Every shape the cell names a record from is covered: an
expanded record, a JSON-encoded reference, each chip of a multi-value cell and
the overflow chip's tooltip, and a bare id resolved on demand. With no policy
loaded, or no `PermissionProvider` mounted, the row is named as served, as
before.

A bare id resolved on demand used to cache the resolved NAME. It now caches the
fetched record and schema, and the name is resolved on every render, the same
shape objectui#10487 gave the lookup editor's hydrated chip. So a policy that
loads or changes after the record arrived relabels the mounted cell, with no
second read of the record.
