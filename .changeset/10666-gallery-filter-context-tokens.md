---
'@object-ui/plugin-list': patch
---

A directly authored `object-gallery` node now resolves the spec's context tokens in its own `filter` (objectui#10666). With `filter: [['owner', '=', '{current_user_id}']]` the gallery used to send the literal token on `$filter`; it now sends the signed-in user's id, and `{current_org_id}` resolves to the active organization. The filter goes through `@object-ui/core`'s shared `resolveFilterPlaceholders`, against the scope `FilterScopeProvider` supplies, the same call `list-view` and `object-grid` have made since objectui#10607. The resolved value is held and compared by structure, so re-rendering with an equal filter issues no extra query, and a change of signed-in user queries again. A filter without placeholders reaches the query unchanged. A gallery rendered as a `list-view` child was already handed a resolved filter, and nothing changes for it.

Date macros such as `{today}` in a directly authored gallery's filter are now resolved in the browser's local time, as they already are for `list-view`, `object-grid` and `object-view`. Before this change they reached the server as literals, and the server resolved them in the tenant's time zone.
