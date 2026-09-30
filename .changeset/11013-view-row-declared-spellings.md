---
'@object-ui/types': minor
'@object-ui/data-objectstack': patch
'@object-ui/app-shell': patch
'@object-ui/plugin-view': patch
---

**The console reads a saved view by the spellings `@objectstack/spec` declares, and stops reading the keys nothing writes (objectui#11013).** This is the console end of the ruling on objectstack#20051: the spec now declares the keys the console writes onto a stored view and reads back (`VIEW_CONSOLE_ROUND_TRIP_KEYS`), and the console reads a stored view under those spellings.

**A saved view keeps its switcher state across a reload.** A view saved as a record (the "+" tab's create, or "Edit view config → Save") used to come back from `listViews()` with only its configuration, name, label and default flag. It now also comes back with its pin (`isPinned`), its position among saved views (`sortOrder`), its switcher group (`visibility`), its column layout (`columnState`) and its bound `object`. Visible effect: a saved view you dragged to a new position keeps that position after a reload, including in a browser that never saw the drag. The carried keys are read off the spec's record, not hand-listed.

**Keys a saved view no longer steers.** No console surface writes any of these onto a view, no view in this repository authors one, and the spec's view schema refuses each by name. A stored view that still carries one now behaves as if it did not:

| key on the stored view | what changes for the user |
| --- | --- |
| `allowExport` | A view carrying `allowExport: false` no longer hides the list's export control or drops its `exportOptions`. Whether a list offers export is the page's setting (the `list-view` / `object-view` node's `allowExport`); which formats it offers is the view's `exportOptions.formats`. |
| `wrapHeaders` | Column-header wrapping follows the page's setting, not the view's. |
| `editRecordsInline` | On the object page this was read as a second spelling of `inlineEdit`. A view carrying only it no longer turns inline editing on; write `inlineEdit`. |
| `clickIntoRecordDetails`, `addRecordViaForm`, `addDeleteRecordsInline`, `collapseAllByDefault`, `fieldTextColor`, `prefixField` | Relayed into the list, which drew nothing from them. No visible change. |

The same keys authored on the `object-view` node itself are unchanged: that node's own values still reach the list.

**The toolbar policy is read as `userActions`.** The `object-view` node the object page builds, and `@object-ui/plugin-view`'s own kanban / calendar / gallery / timeline / gantt / map route (a host that renders the `object-view` node without `renderListView`), read a view's search, sort and filter toggles from `userActions.search`, `.sort` and `.filter`, where they used to read the bare `showSearch`, `showSort` and `showFilters` flags. On that plugin route, a view that declared `userActions: { search: false }` now hides the search control; the object page's list already honoured it. A stored view that still carries a bare flag keeps its answer: `normalizeListViewSchema` folds it onto `userActions`.

**A stored view is bound and identified by its declared keys only.** A view row is matched to its object by `object` (or its configuration's `data.object`), and no longer by `objectName`; it is identified by `name`, and no longer by a top-level `id` or `_id`. This holds in the view switcher (`listViews()` / `listViewOverrides()`), in Studio's view picker for `interfaceConfig.sourceView`, and in Studio's view preview. Every console write stamps both `object` and `name`, and the metadata door refuses a view record or overlay row bound by `objectName` alone, so a row the console wrote is unaffected. The console also no longer stamps an undeclared `objectName` onto the rows it reads, which a saved view's toolbar save used to write back into the stored row.

**BREAKING (TypeScript only) — `NamedListView.allowExport` is retired.** It is now a `?: never` tombstone, like the seventeen members objectui#7924 retired: a TypeScript author who writes it gets a compile error there. Ruling A on objectui#7924 had kept it declared only because both relays read it off a view, and those reads are gone.
