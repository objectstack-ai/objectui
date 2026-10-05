---
'@object-ui/app-shell': patch
---

A grid toolbar change on a served view is stored where the save door keeps it, so it survives a reload (objectui#11625). This covers density, a column-header sort and the hide-fields toggle, on a packaged view such as the showcase's `showcase_task.default` and on a view a user created.

The console saves a toolbar change on a served view by sending the whole stored row, the ViewItem envelope `{ name, object, viewKind, config }`, back to `PUT /api/v1/meta/view/NAME`. It wrote the changed key beside `config` instead of inside it. The door judges a body that has a `config` by the spec's `viewItem` member and drops undeclared top-level keys, as ADR-0005 appendix (c) designs it. So it answered `200`, stored no change, and the view reverted on reload.

The changed key now goes into `config` when it is a key `ListViewSchema` declares: `rowHeight`, `sort`, `hiddenFields` or `inlineEdit`. Every other key stays on the envelope, where the row keeps it: `columnState`, `isDefault`, `isPinned`, `sortOrder` and `visibility`. A row without a `config` is still written flat. So is the personalization overlay (the row with `_isOverride`), whose flat body the door already keeps.

Still open: the console builds each save from the view as it was when the page loaded. A second toolbar change to the same view in the same session therefore overwrites the first one. For example, changing density and then sorting keeps only the sort after a reload. This was true before this fix, on every kind of row.

**Clause-②: no.** Nothing on the package entry changes. `buildPersistedViewBody` is exported from `ObjectView.tsx` but not from `@object-ui/app-shell`.
