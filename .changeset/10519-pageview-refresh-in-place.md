---
'@object-ui/app-shell': patch
---

fix(app-shell): a page action refreshes a custom page's data in place instead of remounting the page (objectui#10519)

`PageView` used to key both of its render branches — the ADR-0047 interface list
and the `SchemaRenderer` page — on a counter it bumped after every successful
page-level action that asks for a refresh (an `api` call, a flow, a server
action, an undo, a screen-flow completion). Each such action therefore remounted
the whole page: scroll position, collapsed sections, tab state and in-progress
edits in every embedded block were lost, and every block refetched from scratch.

The counter is gone. `PageView` now answers the console action runtime's
post-action refresh by declaring the change on the data-invalidation bus
(`notifyDataChanged` from `@object-ui/react`, with the unknown-scope
`objectName: '*'`, since a page binds no object). The embedded blocks that read
the bus refetch in place, once each: the object grid, chart, detail view, list
view, kanban, metric, calendar, gallery, timeline, gantt, map, tree, pivot and
data table, every `object-form` layout, `object-master-detail-form` (edit-mode
lines), `report` / `spec-report` over a dataset, a `dashboard`'s dataset table
widget and its `optionsFrom` filter options, an `object-view` drawn as a kanban,
calendar, gallery or timeline, `record:line_items` with an authored parent, and
the `element:number` / `element:repeater` / `element:record_picker` readers. An
`object-form` holding unsaved input keeps it and takes the re-read when it is
saved or reverted (objectui#10572), and a dashboard filter keeps its selected
value. A `kind: 'react'` page is no longer remounted either: its own read
re-runs in place when its effect names the `useDataInvalidation` nonce the page
scope injects (objectui#10887), and a read keyed on `useAdapter` alone is not
re-run by a page action. The page node's `context` is `{ params }` alone:
nothing read the `refreshKey` it also carried. No prop, export or schema key
changes.

⚠️ **Dated note, 2026-10-02 — `spec-report` is retired — objectui#11440.**
Later in this same release `@object-ui/plugin-report` stopped registering `spec-report`, an alias of
`report`; a node of that type now resolves to nothing. So "`report` / `spec-report` over a dataset"
above now reads `report` over a dataset, the report embedded as `{ "type": "report", "report": { … } }`,
which re-reads in place as this entry says. `.changeset/11440-retire-spec-report.md` states what
ships. The rest of this entry is kept as the reading of this change.
