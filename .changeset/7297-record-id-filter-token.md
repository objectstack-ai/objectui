---
'@object-ui/core': minor
'@object-ui/react': minor
'@object-ui/plugin-grid': patch
'@object-ui/plugin-view': patch
---

A filter on a record page can now be scoped to the record the page shows (objectui#7297). Write `{record_id}` as a filter value, for example `{ "assignee": "{record_id}" }` on an `element:number` counting tasks, and on a `type: 'record'` page it resolves to the id of the record in view: on one person's page the number is that person's count, and on the next person's page it is theirs. It works in a component's own `filter` and in its component-level `dataSource.filter`, on every data component that resolves its filter through `@object-ui/react`'s `useFilterScope()`. The token is declared by `@objectstack/spec` 17.5.0 (`RECORD_CONTEXT_TOKENS`, objectstack-ai/objectstack#20003).

The id comes from the record page's mounted record context, never from a URL parameter or a page variable. `@object-ui/react`'s `useFilterScope()` adds it to the scope it returns (as the new optional `recordId` member of `@object-ui/core`'s `FilterTokenScope`) whenever a `RecordContextProvider` is mounted above the component; `FilterScopeProvider` is unchanged and still carries only the session values. The held filters in `useResolvedFilter`, `object-grid` and `object-view` resolve again when the record changes, so moving to another record queries again without a remount.

Anywhere with no record in context (a list view, a dashboard, a report, or a page that is not a record page) `{record_id}` is refused by name: `resolveContextTokens` reports it through `onUnresolved` (a console warning by default), the way an unresolved `{current_user_id}` is reported, and leaves it as written. It never becomes `null` and its condition is never dropped, so a number can never silently count every record; the ObjectStack server refuses the leftover token by name (`FILTER_TOKEN_UNRESOLVED`). Like the session tokens, `{record_id}` only scopes what a component shows. It is not access control: which rows a user may read is still decided by the server's row-level security.

**Correction, 2026-09-30 (objectui#8945).** The example in the first paragraph, `{ "assignee": "{record_id}" }`, is the retired MongoDB-style record form. `@objectstack/spec` 17.5.0 refuses it at an `element:number` `filter`, because that key takes an array and a record is refused by kind. Write the same condition as a `ViewFilterRule` array, which the spec accepts: `[{ "field": "assignee", "operator": "equals", "value": "{record_id}" }]`. A component-level `dataSource.filter` takes the same array. The `{record_id}` token itself, and the rest of this entry, are unaffected.
