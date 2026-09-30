---
'@object-ui/react': minor
'@object-ui/plugin-calendar': patch
'@object-ui/plugin-gantt': patch
'@object-ui/plugin-kanban': patch
'@object-ui/plugin-map': patch
'@object-ui/plugin-timeline': patch
'@object-ui/plugin-tree': patch
'@object-ui/plugin-detail': patch
'@object-ui/plugin-form': patch
'@object-ui/plugin-list': patch
'@object-ui/components': patch
'@object-ui/types': patch
---

Every data node that sends its own authored `filter` into a query now resolves the spec's context tokens first (objectui#10666). With `filter: [['owner', '=', '{current_user_id}']]` these nodes used to send the literal token; they now send the signed-in user's id, and `{current_org_id}` resolves to the active organization:

- `object-calendar`, `object-map` and `object-tree`, on both the object query and the inline (`provider: 'value'`) query;
- `object-gantt`, `object-kanban` and `object-timeline`;
- `record:related_list` and `record:line_items`, where the node's own filter is combined with the parent-record condition;
- the `element:repeater`, `element:number` (both the `aggregate` filter and the `find` fallback) and `element:record_picker` page elements.

`list-view`, `object-grid` and `object-gallery` already did this, and are unchanged.

**New in `@object-ui/react`: `useResolvedFilter(filter, scope)`.** Pass it a node's authored filter and `useFilterScope()`. It resolves the filter through `@object-ui/core`'s shared `resolveFilterPlaceholders` and holds the result: re-rendering with an equal filter (even one rebuilt inline on every render) hands back the same value, so a fetch effect keyed on it does not run again, while a structurally different filter or a change of signed-in user or organization resolves again. A filter with no token to resolve is handed back as the value you passed in. The hold is the one `list-view` and `object-gallery` used privately; `plugin-list` now imports it from here, and no second copy remains in that package.

What changes for an app:

- A filter with no placeholders reaches the query as before, unchanged.
- Nodes that re-queried whenever the host rebuilt an equal filter inline (`object-calendar`, `object-gantt`, `object-kanban`, `object-map`, `object-tree`) no longer issue those redundant queries.
- Date macros such as `{today}` in these nodes' own filters are now resolved in the browser's local time, as they already are for `list-view`, `object-grid` and `object-view`. Before, they reached the server as literals, and the server resolved them in the tenant's time zone.

`@object-ui/types`: the `filter` docblocks on `ObjectMapSchema`, `ObjectTreeSchema`, `ObjectGanttSchema`, `ObjectCalendarSchema`, `ObjectKanbanSchema`, `ObjectChartSchema` and `ObjectGallerySchema` (and the matching zod descriptions) no longer say the filter is forwarded verbatim; they say its context tokens are resolved first. No type changes.
