---
'@object-ui/plugin-detail': minor
'@object-ui/app-shell': minor
---

A record page draws one provenance footer for its record, whatever the number of `record:details` nodes it carries (objectui#12307).

Every `DetailView` mounted its own `RecordMetaFooter`, the one-line "Created … Updated …" summary, and a record page renders one `DetailView` per `record:details` node. A page with two nodes printed the same line twice, and a node whose sections were all hidden drew a block holding that line and nothing else (measured on objectstack-ai/cloud's environment page).

- **`@object-ui/plugin-detail`.** A `record:details` node that reads the record page's record (it carries no `dataSource` binding) no longer draws a footer: the `DetailView` it mounts leaves the line to the page. So a node whose sections are all hidden now draws nothing. A standalone `DetailView` (the `detail-view` node, `RecordDetailDrawer`, `RecordDetailPanel`, a direct React caller) keeps its footer, and so does a BOUND `record:details`, which shows a record the page does not.
- **`@object-ui/app-shell`.** `RecordDetailView` draws the record's `RecordMetaFooter` once, at the page foot, after the page tree and the panels it appends there, so the line no longer moves with the active tab. The Studio page preview draws it the same way under its sample record.

Behaviour change for a host that mounts `RecordContextProvider` itself and renders `record:details` nodes in it: those nodes no longer draw the record's footer, so the host renders `RecordMetaFooter` (already exported from `@object-ui/plugin-detail`) once, with the record as `data` and the object definition as `objectSchema`, where its page ends.

Nothing is added to either package entry: no export, prop, type member or schema key. The signal from `record:details` to its `DetailView` is a context internal to `@object-ui/plugin-detail`.
