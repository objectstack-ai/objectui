---
'@object-ui/plugin-form': patch
'@object-ui/fields': patch
'@object-ui/types': patch
---

Saving a master-detail edit form no longer rewrites the position of lines the
user did not touch (objectui#12286).

The edit form read each collection's lines with no sort, so its line grid drew
them in whatever order the server returned, and the grid stamped every line's
index into the child's sort field (`position`, `sort_order`, …) on any change.
Editing one cell of one line therefore saved a new position onto its untouched
siblings, swapping their stored order and bumping their `updated_at`.

- `MasterDetailForm` now reads the lines ascending by the child's derived sort
  field, the record id breaking ties, so the grid opens in stored order.
- The line grid (`field:grid` with a `sortField`) renumbers only when a row is
  added, removed, duplicated or moved. A cell edit leaves every row's position
  as it was, so lines whose stored positions are tied, empty or gapped are not
  renumbered by an edit either.

Editing one line's field now sends exactly one update, and moving a line sends
only the lines whose position changed. The `GridFieldMetadata.sortField`
description says when the grid stamps the field.
