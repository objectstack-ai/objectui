---
"@object-ui/app-shell": major
"@object-ui/auth": major
"@object-ui/cli": major
"@object-ui/components": major
"@object-ui/core": major
"@object-ui/data-objectstack": major
"@object-ui/fields": major
"@object-ui/layout": major
"@object-ui/permissions": major
"@object-ui/plugin-chatbot": major
"@object-ui/plugin-dashboard": major
"@object-ui/plugin-designer": major
"@object-ui/plugin-detail": major
"@object-ui/plugin-form": major
"@object-ui/plugin-gantt": major
"@object-ui/plugin-grid": major
"@object-ui/plugin-list": major
"@object-ui/plugin-timeline": major
"@object-ui/plugin-tree": major
"@object-ui/plugin-view": major
"@object-ui/react": major
"@object-ui/types": major
---

Follow `@objectstack/*` across its major, 17 → 18 (objectui#12030). This is the synchronized bump AGENTS.md §版本号策略 reserves `major` for: objectui's major tracks the `@objectstack` major its packages depend on ("major 相同即兼容"), so the fixed group crosses to 18 together with it. It is the only `major` that policy admits.

Every `@objectstack/*` range these packages declare in `dependencies` or `peerDependencies` moves from `^17.x` to `^18.0.0-next.0`, the `next` prerelease of `@objectstack/*` 18. The repository is in Changesets pre mode on tag `next` (`.changeset/pre.json`), as objectstack's 18 line is, so this release is `18.0.0-next.N` on the npm `next` dist-tag, and `latest` stays on 17.7.0 until `@objectstack` 18 is GA and both repositories exit pre mode.

**Breaking for consumers:** an install that resolves `@objectstack/spec` (or `@objectstack/client`, `@objectstack/formula`, `@objectstack/lint`) 17.x no longer satisfies these ranges. A consumer must move its own `@objectstack/*` packages to the 18 line, starting with `18.0.0-next.0`, at the same time as it takes this release.

**Retired with the spec:** `@objectstack/spec` 18 tombstones `object-grid`'s `defaultFilters` and refuses it by name, and `ObjectGrid` and `ObjectView` stop reading it (`table.defaultFilters` on an `object-view` included). A view that still carries it renders unfiltered: rename the key to `filter`, whose value is the same rule array.
