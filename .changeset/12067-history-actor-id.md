---
'@object-ui/plugin-detail': patch
'@object-ui/app-shell': patch
---

A record's History tab and activity feed name the user behind an activity row that carries `actor_id` and no `actor_name` (objectui#12067). On `@objectstack/*` 17.7.0 the audit writer fills only `actor_id`, so `record:history` showed every such entry as "Unknown user", and the `record:activity` block and the console record page's activity feed showed the change as made by "System". Their `sys_activity` reads now expand `actor_id`, which brings each user's record back with the page in the same request, and the entry shows that user's `name`. `actor_name`, when present, still wins: it is the name recorded when the action happened. A row with neither, or whose user the viewer may not read, keeps the existing fallback, and a raw user id is never shown as a name.
