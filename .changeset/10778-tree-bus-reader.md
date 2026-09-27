---
'@object-ui/plugin-tree': patch
---

fix(plugin-tree): `object-tree` re-reads its rows on the data-invalidation bus

The record effect of `ObjectTree` now names the `useDataInvalidation` nonce for
the object its `object` provider queries — whether the node spells it
`objectName` or `data: { provider: 'object', object }` — so a write declared on
the bus (`notifyDataChanged`, as a page action over raw HTTP does) re-reads the
tree in place, keeping the user's expansion choices. Before, a tree that no
host handed rows to refreshed after such a write only when its host remounted
it, and `PageView` is about to stop doing that (objectui#10519).

Inline rows (a `data` array, the `value` provider) name no object and do not
subscribe. A tree whose host hands down rows (the `list-view` tree) subscribes
too: it runs its own full query ahead of those rows, so its freshness does not
rest on the host's rows moving.
