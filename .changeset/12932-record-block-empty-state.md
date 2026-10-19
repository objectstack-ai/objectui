---
'@object-ui/plugin-detail': minor
'@object-ui/types': minor
---

Bound record blocks draw an authored empty state when their binding answers no row (objectui#12932, the renderer half of objectstack-ai/objectstack#24266).

`record:details`, `record:highlights` and `record:quick_actions` take the spec's `emptyState` (`{ title, message, icon, link }`, the list view's own `EmptyStateSchema`). When the block carries a `dataSource` binding and the bound read answers no row, the block draws that empty state in its place. A read the server refuses as forbidden reads as no row, so the empty state is drawn for it too. The drawing is the one `object-grid` uses for its own `emptyState`: a Lucide `icon`, a `title` and a `message`, each a plain string or an inline locale map, and one `link` followed through the action runner. A `title` left out reads "Record not found".

It is not drawn while the read is loading, in place of the error panel a failed read shows, when a bound row is there, or on a block with no `dataSource`. A block that declares no `emptyState` keeps its own placeholder: "Record not found" on `record:details`, nothing on `record:highlights`, and the empty bar on `record:quick_actions`.

The three registrations publish the `emptyState` input.

`@object-ui/types` declares `emptyState` on `RecordDetailsComponentProps` and `RecordHighlightsComponentProps`, by reference to the spec's `EmptyState` type, so a typed literal can author it.

`@object-ui/plugin-detail` now requires `@objectstack/spec` `^18.0.0-next.5`, the first published release that declares the key.
