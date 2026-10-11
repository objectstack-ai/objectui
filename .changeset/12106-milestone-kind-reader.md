---
'@object-ui/plugin-detail': patch
---

A record activity feed shows an object's `activityMilestones` rows of type `completed`, such as "Case resolved", instead of hiding them as completed tasks (objectui#12106).

A milestone keeps the `type` its declaration names, so "Case resolved" declared with `type: 'completed'` arrived as a `completed` row. The feed mapped every `completed` row to a `task` item, and `showCompleted` is off by default, so the milestone was hidden on every record page that did not set it, including the default page.

plugin-audit now stamps `metadata.kind: 'milestone'` on a row a milestone fired (objectstack#22771). The feed reads that marker. A `completed` row that carries it renders as a `system` item, the presentation every other author-typed milestone already gets, and shows whatever `showCompleted` says. A task's own "Task completed" milestone shows on that task's page for the same reason.

A `completed` row without the marker is unchanged: it is a `task` item, hidden unless `showCompleted` is on. That covers rows from a runtime that does not stamp the marker yet, and rows an app inserts itself. `filterMode: 'tasks_only'` and `types: ['task']` still select tasks only, so they do not list a milestone. The `record:activity` block's own read and the console record page's feed both read rows through `activityRowToFeedItem`, so both change together. No export, prop or type changes.
