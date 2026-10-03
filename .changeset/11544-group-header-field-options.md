---
'@object-ui/plugin-grid': patch
---

A grouped `object-grid` labels its group headers from the object field's
`options` only; a column's `options` no longer relabels them (objectui#11544).

`ListColumnSchema` (`@objectstack/spec/ui`) is a strict object with no
`options` member, so a view that authors `options` on a column is refused at
publish with `unrecognized_keys`, and `ObjectGridSchema` refuses the column
too. `ObjectGrid`'s group-header label memo (`groupValueFormatter`) read that
key anyway: a column's `options` won over the object field's, and decided both
the header text and, through `order`, the order of the groups. That read is
retired rather than declared upstream; the authors measurement behind the
ruling found no view that writes a column-level `options`.

**Behaviour change.** A grid handed a column that carries `options` (which
validation refuses) now shows the object field's option labels in the group
headers, or the stored value when the field has no options. A column's
declared `type` still respells a grouped value (a `boolean` column reads
Yes / No), and a grid whose columns carry no `options` is unchanged.
