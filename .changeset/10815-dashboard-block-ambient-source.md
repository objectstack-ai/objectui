---
'@object-ui/plugin-dashboard': patch
---

fix(plugin-dashboard): a `dashboard` block on a page loads its dataset widgets, and they re-read on the data-invalidation bus

`DashboardRenderer` read its adapter from its `dataSource` prop only. A page
renders its blocks through `SchemaRenderer`, which passes no adapter prop, so a
`dashboard` block held on a page sent no `queryDataset` call and every
dataset-bound widget showed "This data source does not support dataset
queries." although the page had a capable adapter. The renderer now resolves
its adapter the way `object-grid`, `object-form` and `detail-view` do
(`useResolvedDataSource`): the prop first, the `SchemaRendererProvider` context
second. The widgets, the filter bar's `optionsFrom` read and the drill drawers
all get that one adapter. A host with no capable adapter anywhere still sees
the alert.

`DatasetWidget`'s query now also names the `useDataInvalidation` nonce for the
dataset's base object (the `object` its answer names), so a write declared on
the bus (`notifyDataChanged`) re-reads the tile in place. This holds on both
dashboard surfaces. The current rows stay on screen under a refresh indicator
during the re-read, not the loading skeleton. A widget whose adapter cannot run
dataset queries subscribes to nothing.
