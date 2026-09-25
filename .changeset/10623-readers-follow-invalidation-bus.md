---
'@object-ui/plugin-timeline': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-map': patch
'@object-ui/components': patch
---

Five more page blocks re-read when the data-invalidation bus (`notifyDataChanged` from `@object-ui/react`) reports a write to the object they read (objectui#10623). These blocks read neither `onMutation` nor the bus, so any write — through the data source or past it (a page action over raw HTTP, a flow, a server action) — showed only when something remounted them. Each fetch effect now names the `useDataInvalidation` nonce for its object; an unscoped change (`'*'`) matches too, and a change to another object does not.

- `@object-ui/plugin-timeline`: `object-timeline` re-reads its rows; a canvas that already shows rows stays mounted while the re-read runs.
- `@object-ui/plugin-list`: `object-gallery` re-reads its cards; collapsed groups stay collapsed.
- `@object-ui/plugin-map`: `object-map` re-reads the markers it is showing without its loading placeholder, so the map stays mounted and the camera stays where the user left it. If that re-read fails, the last markers stay on the map and the failure is logged to the console, as `ObjectGantt`'s background refresh does. A changed query still shows the placeholder and re-fits the camera, even when a bus event arrives with it. Two older faults in the same fetch are fixed as well: a slow earlier answer can no longer overwrite a newer one, and a load that succeeds now takes the map off an earlier error screen.
- `@object-ui/components`: `element:number` re-reads its aggregate and `element:repeater` its rows.

Rows a host hands these blocks (`data`, `bind`, authored `items`, an inline `value` set) are still the host's to refresh; only the blocks' own queries follow the bus.
