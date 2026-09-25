---
'@object-ui/plugin-timeline': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-map': patch
'@object-ui/components': patch
---

Five more page blocks re-read when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a write to the object they read (objectui#10623). A write that bypasses the data source — a page action over raw HTTP, a flow, a server action — fires no `onMutation`, so these blocks used to show it only when something remounted them. Each fetch effect now names the `useDataInvalidation` nonce for its object; an unscoped change (`'*'`) matches too, and a change to another object does not.

- `@object-ui/plugin-timeline`: `object-timeline` re-reads its rows; a canvas that already shows rows stays mounted.
- `@object-ui/plugin-list`: `object-gallery` re-reads its cards; collapsed groups stay collapsed.
- `@object-ui/plugin-map`: `object-map` re-reads its markers without showing its loading placeholder, so the map stays mounted and the camera stays where the user left it.
- `@object-ui/components`: `element:number` re-reads its aggregate and `element:repeater` its rows.

Rows a host hands these blocks (`data`, `bind`, authored `items`, an inline `value` set) are still the host's to refresh; only the blocks' own queries follow the bus.
