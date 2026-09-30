---
'@object-ui/core': minor
---

fix(core): a dashboard `dateRange` that omits `defaultRange` now takes the spec's declared default preset (objectui#10339).

`@objectstack/spec` declares `DashboardSchema.dateRange.defaultRange` with `.default('this_month')`, but
`resolveDashboardFilterDefs` treated an omitted `defaultRange` as "no filter", so a dashboard authored as
`dateRange: { field: 'created_at' }` rendered unfiltered while the platform's parse of the same document said
`this_month`. The read site now applies the spec default, read from the spec's own `dateRange` schema rather
than a copied string.

**Behaviour note:** an authored `dateRange` with no `defaultRange` now opens filtered to `this_month`, matching
the spec. An explicit `defaultRange` — `custom` included — is unchanged, and a dashboard with no `dateRange` at
all still gets no built-in date filter.
