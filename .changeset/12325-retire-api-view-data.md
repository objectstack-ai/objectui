---
'@object-ui/core': minor
'@object-ui/react': minor
'@object-ui/plugin-gantt': minor
'@object-ui/plugin-list': minor
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-map': patch
'@object-ui/types': patch
'@object-ui/console': patch
---

The view-level `provider: 'api'` data source is no longer read anywhere in objectui (objectui#12325). `@objectstack/spec` retires it (objectstack#23082, ADR-0049): a view binds its object (`provider: 'object'`) or static rows (`provider: 'value'`), and a metadata-declared API call is the page element's `dataSource` binding.

Breaking, declared as `minor` per the version-alignment rule:

- **`resolveDataSource`** (`@object-ui/core`) has no `api` arm. A block that still says `provider: 'api'` is an unknown provider and gets an unknown provider's answer (the fallback DataSource, else `null`); no `ApiDataSource` is built from its `read` / `write`. `ResolveDataSourceOptions` loses `fetch` and `defaultHeaders`, which only that arm read.
- **`ViewDataProvider`** (`@object-ui/core`) has no `api` arm: such a config resolves with `Unknown data provider: api`. `ViewDataConfig` and `ResolvedData.provider` drop `'api'`, and `DataFetcher.fetchUrl`, which only that arm called, is removed.
- **`useViewData`** (`@object-ui/react`) no longer keys on or threads anything for an `api` block.
- **`ObjectGantt`** reads no `api` block: its `read` URL is never requested, and the chart answers it like any unknown provider. `ObjectCalendar` and `ObjectMap` drop their `api` branches, which only warned "not yet implemented".
- **`ListView`** no longer stands down for a gantt view with an `api` block: it fetches the bound object like any other list.

Unchanged: `ApiDataSource` stays a class for code that constructs it from an `ApiDataSourceConfig`, so the console's approvals inbox reads exactly as before.
