---
'@object-ui/react': minor
'@object-ui/i18n': patch
---

feat(react): a page element's API data source is rendered — `dataSource: { provider: 'api', read: { url }, path? }` binds the selected answer as `data` (objectui#12197)

Clause-②: yes

`SchemaRenderer` now honours `@objectstack/spec`'s `ElementApiDataSourceSchema` on every node. It reads the same-origin `read.url` with `GET` through `SchemaRendererProvider`'s `apiFetch` (the global `fetch` when no host supplies one), selects `path` from the answer, and binds the value as `data` in the node's `${…}` holes and its `visibleWhen`, and in its subtree's. While the read is in flight the node draws a loading line; a failed read, or a `path` that selects nothing, draws an error panel naming why, titled in the page's language from two new keys, `element.component.apiRefused` and `element.component.apiUnreadable` (all ten packs). The binding is parsed with the spec's own schema first: a cross-origin or protocol-relative `url`, a credential key, or a non-`GET` method is refused with the spec's message and no request is sent. Elements binding the same URL at once share one request; nothing is cached.

New exports: `useElementApiDataSource`, `judgeElementApiDataSource`, `isElementApiDataSourceShape`, `selectElementApiPath`, `readElementApi`, and the types `ElementApiDataSourceStatus` and `UseElementApiDataSourceResult`. A node without an API binding renders as before and issues no request.
