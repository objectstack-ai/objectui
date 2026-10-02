---
'@object-ui/app-shell': patch
---

The dataset designer no longer writes `field: ''` for a row whose Field box is blank (objectui#11402).

New dimension and measure rows used to be seeded with `field: ''`, so a Studio author who added a plain row-count measure and left the Field box blank saved `field: ''`. That value means nothing to any reader: the analytics query answered 500 on the ObjectQL strategy for a `count` measure carrying it, and the narrowed dataset schema (objectstack-ai/objectstack#21240) refuses it at save.

- New rows are seeded without a `field` key, and a blank Field value removes the key instead of storing `''`. A `count` measure with no field therefore saves the one spelling the spec has for count(*): the key absent.
- A dimension needs a field. A dimension whose Field box is blank (including a stored `field: ''`) is reported to the editor's Save gate, the same channel that holds Save, autosave and the shortcut for a CEL expression that does not parse, until a field is picked. Its Field label carries the designer's required marker.
- Nothing is filled in on the author's behalf: no `id` or other default field is written.
