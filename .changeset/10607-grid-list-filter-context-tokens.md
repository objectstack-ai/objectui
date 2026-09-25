---
'@object-ui/plugin-grid': patch
'@object-ui/plugin-list': patch
---

A directly authored `object-grid` or `list-view` node resolves the spec's context tokens in its own filter (objectui#10607).

`filter: [['owner', '=', '{current_user_id}']]` on an `object-grid` or `list-view` node authored
straight into a page, not reached through `object-view`, went out on `$filter` as the literal
token: neither package called `@object-ui/core`'s `resolveFilterPlaceholders`. Each now resolves
the node's own filter once through that shared resolver, with the session scope the host provides
through `useFilterScope` (the console shell mounts `FilterScopeProvider` from the signed-in user
and the active organization). On `object-grid` that is `filter` and its deprecated alias
`defaultFilters`: the resolved `filter` feeds the grid's query and its server-side export, and the
resolved alias feeds the query when `filter` is absent. On
`list-view` it is `filter`, and the resolved value feeds the list's query, the child view it
renders, the self-querying views (gantt, tree, chart), the export and the empty-state copy.
`object-view` has done this since objectui#10506; these two nodes, authored directly, had not.

The relative-date macros (`{today}`, `{current_quarter_start}`, …) resolve in the same call, in
the browser's local time, as on the other surfaces that call the resolver. Where they used to
reach a backend that resolves them itself, as the ObjectStack server does in the tenant's
configured `localization.timezone` (UTC by default), a browser whose local day differs from the
server's day can now get a different day.

A token the scope cannot resolve is left as written and the resolver warns once, which is the
resolver's own rule, so the filter is never widened.

The resolved value is held against its inputs: the authored filter, compared by structure, and the
scope's three members (`currentUserId`, `currentOrgId`, `onUnresolved`), each compared on its own.
A re-render that changes none of them does not refetch, including one that rebuilds an equal
filter inline; a new signed-in user refetches with the new id. Date macros are therefore resolved
once and held until the scope or the authored filter changes, and a refetch for another reason
reuses the held value. `object-view` already hands these nodes a filter it has resolved
(objectui#10506); resolving that value again changes nothing, because a resolved id or date no
longer matches the placeholder pattern.

On `object-grid`, the load effect now also refetches when the resolved `defaultFilters` changes (a
new signed-in user, or an in-place edit of the alias). It read that alias without keying on it
before.
