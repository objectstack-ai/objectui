---
'@object-ui/plugin-grid': patch
---

fix(plugin-grid): switching a server-grouped grid's grouping field shows exactly the new field's groups

Switching a list view's grouping field (Title to Priority, say) used to leave
phantom `(empty)` group headers stuck on "Loading grid…" beside the real ones
until the page was reloaded, while the server answered only the real groups.
The grid kept the previous field's group headers while it asked for the new
field's, and read them under the new field's name: a header row carries only
the field it was grouped by, so every old header became an `(empty)` group on
the same key, and those duplicates outlived the real answer.

The group headers and each group's page of rows are now held against the
question they answer (the grouping fields, the view's filter and search, and
the header's summary columns), and an answer is only ever read under that same
question. A change of grouping field, filter or search therefore shows the
grid's loading state until the server's groups for the new question arrive,
rather than the previous groups, and a group's rows still in flight when the
field changed never render under a new group that happens to share its key. A
refresh of the same view (after an edit, say) still keeps the groups and their
rows on screen while it reloads.
