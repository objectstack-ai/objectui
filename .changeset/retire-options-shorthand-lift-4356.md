---
'@object-ui/core': minor
---

feat(core)!: bare-string `globalFilters[].options` is no longer lifted; use `{ value, label }` objects, the spec's form (objectui#4356).

**Breaking — published runtime behaviour removed; the bump stays `minor` under this repository's version policy, with the break stated here.** `resolveDashboardFilterDefs` used to lift a bare-string member of a dashboard's `globalFilters[].options` — `'EMEA'` became `{ value: 'EMEA', label: 'EMEA' }` — and, since objectui PR #4601, logged a deprecation warning while doing so. That lift is gone. A member that is not a `{ value, label }` object (a string, a number, a boolean) now yields no option: a shorthand-only filter resolves with no `options`, and a mixed array keeps only its object members. The runtime reads the document exactly as `@objectstack/spec`'s `GlobalFilterSchema` does, which has always refused the shorthand at publish.

**Why now.** Maintainer ruling on objectstack#7917 (2026-08-12, verbatim 「7917 ②」): the spec stays strict and the runtime lift retires. The retirement window closed on the 2026-09-02 ruling, verbatim 「objectstack#7917 不考虑现有数据」 — Phase 2 proceeds on release cadence alone, with no stored-dashboard survey and no migration entry. Phase 0 (objectui stopped teaching the form) and Phase 1 (the deprecation warning) shipped in PR #4601.

**What a stored dashboard sees.** A `select` filter whose options were all bare strings renders with an empty option list. In development a single `console.warn` — once per offending filter per session, the same memo the deprecation warning used — names the filter, the dropped members and the rewrite; it no longer promises a lift. Rewrite each string `X` as `{ "value": "X", "label": "X" }`.

`resetDashboardFilterWarnings()` stays exported: the warn-once memo it clears now guards the dropped-member warning instead of the deprecation warning.
