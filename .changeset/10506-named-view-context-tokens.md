---
'@object-ui/plugin-view': patch
---

`ObjectView` resolves the spec's context tokens in the filters it hands on (objectui#10506).

A per-user named list view, `{ field: 'owner', operator: 'equals', value: '{current_user_id}' }`,
reached the query with the literal token on the registered `object-view` node: this component
had no read of `@object-ui/core`'s `resolveFilterPlaceholders`, while the app-shell host resolved
the same view.

The three authored filter segments (the active view's filter, `table.filter`,
`table.defaultFilters`) are now resolved once through that shared resolver, with the session
scope the host provides through `useFilterScope` (the console shell mounts `FilterScopeProvider`
from the signed-in user and the active organization). All three paths a filter leaves this
component by read the resolved segments: the query a non-grid view issues, the `object-grid`
schema handed to `ObjectGrid`, and the `list-view` schema handed to a host's `renderListView`.
The relative-date macros (`{today}`, `{current_quarter_start}`, …) resolve in the same call,
as they already did on every other surface.

A token the scope cannot resolve is left as written and the resolver warns once, which is the
resolver's own rule: with no `FilterScopeProvider` mounted, a view filtered on
`{current_user_id}` still matches no record rather than every record.

The resolved value is held against its raw inputs, compared by structure, and the scope's two
ids. `ObjectGrid` and `ListView` key their fetch on the filter's identity, so a host that
re-renders without changing anything does not trigger a refetch, and a `{now}` macro does not
produce a new value on every render. The app-shell host resolves the delegated filter a second
time in its own `renderListView`; a resolved id no longer matches the placeholder pattern, so
that pass changes nothing.
