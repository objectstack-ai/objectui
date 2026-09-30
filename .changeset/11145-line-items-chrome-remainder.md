---
'@object-ui/fields': patch
'@object-ui/i18n': patch
'@object-ui/plugin-form': patch
---

fix(plugin-form,fields,i18n): the line-items panel, the grid field and the master-detail heading finish speaking the user's language

Under a Chinese session the rest of the line-items chrome still rendered in
English. The record page's `record:line_items` panel read `Loading…`, `Save the
record first to add line items.`, `This record’s line items have not been
loaded.`, the `Failed to load line items` / `Failed to save line items`
fallbacks and its no-`childObject` hint. The line-items grid (`GridField`) read
its footer `Total`, its column chooser's `Columns` / `Optional columns`, the
computed cell's `Computed` tooltip and its row actions. A master-detail
collection with no `title` was headed `Line Items`.

They now read the locale packs. Reused keys: `common.loading`, `table.columns`,
`form.masterDetail.total` (the footer), `view.dragToReorder` (the drag handle)
and `form.lineItems.title` (the master-detail heading). New keys, in all ten
packs: `form.lineItems.saveRecordFirst`, `form.lineItems.notLoaded`,
`form.lineItems.loadFailed`, `form.lineItems.saveFailed`,
`form.lineItems.noChildObject`, `fields.grid.optionalColumns`,
`fields.grid.computed`, `fields.grid.openRow`, `fields.grid.duplicateRow` and
`fields.grid.removeRow`.

Each row action now has one key, read by both its `aria-label` and its `title`.
The English kept for each is the accessible name it already had:

- open the row in the full form: `Open row` (the tooltip was `Open full form`);
- duplicate the row: `Duplicate row` (the tooltip was `Duplicate line`);
- remove the row: `Remove row` (no tooltip, as before);
- the drag handle: `Drag to reorder`.

Only the defaults move. An authored collection `title` still wins, and so does
a failure message the server sent. Apart from the two tooltips above, English
output is byte-identical to the literals these replace, with or without an i18n
provider.
