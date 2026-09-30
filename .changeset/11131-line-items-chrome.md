---
'@object-ui/fields': patch
'@object-ui/i18n': patch
'@object-ui/plugin-form': patch
---

fix(plugin-form,fields,i18n): the record page's line-items panel and the line-items grid speak the user's language

Under a Chinese session the record page's `record:line_items` panel still
rendered some of its chrome in English. Its default title read `Line Items` and
its button read `Save` / `Saving…`. The line-items grid (`GridField`) read
`Add line` on its Add button, `No items yet — click “Add” to begin.` in list
mode, and `No items` when read-only.

They now read the locale packs. The button reuses `common.save` and
`detail.saving`, and the empty text names `detail.add`. Four new keys are added
to all ten packs: `form.lineItems.title`, `fields.grid.addLine`,
`fields.grid.noItems` and `fields.grid.noItemsAddHint`.

Only the defaults move. An authored `title` or `add_label` still wins, and an
authored `add_label` is also the label the empty text names. English output is
byte-identical to the literals these replace, with or without an i18n provider.
