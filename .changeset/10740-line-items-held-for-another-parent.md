---
'@object-ui/plugin-form': patch
---

fix(plugin-form): the line-items panel neither draws nor saves the lines it holds for another parent record (objectui#10740)

The `record:line_items` panel (`LineItemsPanel`) holds one set of rows, replaced
when a load commits. When the host moved the panel to another parent record
without a remount and that parent's load failed, the previous parent's lines
stayed on screen, edits included, drawn editable with Save enabled; Save then
wrote them under the new parent's id, moving another record's lines to it. A load
that declined for the new parent (a refused filter) drew the decline's own notice
but left the same Save enabled over the same held rows.

Now the panel records which parent its held rows belong to, wherever the rows are
written: a load's commit, or an edit made before any load settled. While that
parent is not the current one, no held line is drawn (after a failed load a
placeholder stands where the grid would be, under the failure's banner; after a
refused-filter decline that filter's own notice stands there, as before; after a
lost-adapter decline the placeholder stands alone), the Save button is off, and a
save sends nothing. A load for the current parent that commits
takes the grid back. Unchanged: a load for the new parent that succeeds replaces
the rows as before, and a re-load of the same parent that fails keeps the
author's unsaved edits drawn, editable and saveable under that parent.
