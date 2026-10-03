---
'@object-ui/components': patch
'@object-ui/i18n': patch
'@object-ui/console': patch
---

objectui now resolves `@objectstack/*` 17.6.0 (objectui#11438). One declared range moves: `@object-ui/types` raises its `@objectstack/spec` floor to `^17.6.0` in objectui#11227's own changeset, because its published types read `EmptyState` / `EmptyStateSchema`, which 17.5.0 does not export. Every other `@objectstack/*` range already admits 17.6.0 and stays as it was, and `check:spec-floors` names no other floor that has to rise. Everything below is a contract move 17.6.0 made, and it already reaches any consumer that resolves `@objectstack/spec ^17.6`.

- `@object-ui/components`: the `page:header` registration no longer publishes a `breadcrumb` input. 17.6.0 retires the key (objectstack#20758) and refuses it by name; the renderer has ignored it since objectui#11166.
- `@object-ui/i18n`: a served translation document is recognised as a spec payload when it carries only the `picklists` group, which 17.6.0's `GetTranslationsResponseSchema` adds. Such a bundle used to be returned untransformed, so nothing read it. The group is now namespaced under `app` like every other group.
- `@object-ui/console`: the bundle inlines the 17.6.0 packages, so its client-side validation answers as a 17.6.0 server does. The first screen is smaller: 17.6.0's spec root no longer carries the migration chain, so the eager closure is 250,096 gzipped bytes lighter (measured against a `main` build), and the bundle budget comes down by that amount.
