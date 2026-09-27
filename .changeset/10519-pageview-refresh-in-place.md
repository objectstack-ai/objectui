---
'@object-ui/app-shell': patch
---

fix(app-shell): a page action refreshes a custom page's data in place instead of remounting the page (objectui#10519)

`PageView` used to key both of its render branches — the ADR-0047 interface
list and the `SchemaRenderer` page — on a counter it bumped after every
successful page-level action (an `api` call, a flow, a server action, an undo,
a screen-flow completion). Each such action therefore remounted the whole page:
scroll position, collapsed sections, tab state and in-progress edits in every
embedded block were lost, and every block refetched from scratch.

The counter is gone. The console action runtime's post-action refresh now
declares the change on the data-invalidation bus (`notifyDataChanged` from
`@object-ui/react`, with the unknown-scope `objectName: '*'`, since a page binds
no object), and the embedded blocks that read the bus — the object grid, chart,
detail view, list, kanban, metric, calendar, gallery, timeline, map, every
`object-form` layout, and the `element:number` / `element:repeater` readers —
refetch in place, each exactly once. The page node's `context` is `{ params }`
alone: nothing read the `refreshKey` it also carried. No prop, export or schema
key changes.
