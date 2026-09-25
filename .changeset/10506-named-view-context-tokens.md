---
'@object-ui/plugin-view': patch
'@object-ui/core': patch
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
The relative-date macros (`{today}`, `{current_quarter_start}`, …) resolve in the same call, in
the browser's local time, as they already did on the surfaces that call the resolver: the
app-shell host, `ObjectChart` and the dashboard widgets. (A directly authored `object-grid` or
`list-view` node still does not call it.) Where they used to reach a backend that resolves them
itself, as the ObjectStack server does in UTC, a browser whose local day differs from UTC can now
get a different day.

A token the scope cannot resolve is left as written and the resolver warns once, which is the
resolver's own rule, so the filter is never widened. With no `FilterScopeProvider` mounted, what a
literal `{current_user_id}` then selects depends on the backend: the ObjectStack server resolves
it for a signed-in request and refuses it with a 400 otherwise, and a backend with no resolver of
its own matches no record.

The resolved value is held against its inputs: the raw segments, compared by structure, and the
scope's three members (`currentUserId`, `currentOrgId`, `onUnresolved`), each compared on its own.
`ObjectGrid` and `ListView` key their fetch on the filter's identity, so a host that re-renders
without changing anything does not trigger a refetch. Date macros are resolved once and held until
the user, the organization or a segment changes, so `{now}` and `{today}` do not produce a new
value on every render of this component: that governs the query a non-grid view issues, the grid,
and a `renderListView` host that queries with the filter it is handed. The console's app-shell
host is not such a host: its `renderListView` resolves the active view's own filter itself
(`viewDef.filter ?? listSchema.filter`, with no filter segment in the schema it gives this
component), so its date macros and its `'current-user'` fallback for a signed-out user are
unchanged. A host that resolves the handed value again, as the app-shell's fallback would, changes
nothing: a resolved id or date no longer matches the placeholder pattern. With no user in scope,
this component's pass warns; the app-shell's own pass substitutes `'current-user'` silently, as
before, so the console's query is unchanged and the one difference is that warning.

`@object-ui/core`'s two placeholder walks (`resolveContextTokens` and `resolveDateMacros`, both behind
`resolveFilterPlaceholders`) now return a non-plain object as the same instance instead of rebuilding
it from its own keys, so a `Date` comparand, which the spec admits, no longer comes back as `{}`;
plain and null-prototype objects are still walked. A non-plain object is a leaf whatever it is: a
class instance with own keys carrying a token is also returned as the same instance, no longer
copied and resolved. The contract review of this change found no in-repo caller that passes one.
