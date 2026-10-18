---
'@object-ui/plugin-detail': patch
---

A record activity feed shows a call, meeting or email logged on the record, instead of hiding it as a completed task (objectui#12228). On an object with no authored record page, a call logged with Log a Call now appears in the default page's feed.

An action that logs an interaction writes the interaction as its own record (an event, a `sys_email` row) and then one `sys_activity` row of type `completed` that points at it through `source_object` / `source_id` (ADR-0052). The feed mapped every `completed` row to a `task` item, and `showCompleted` is off by default, so the default record page, whose `record:discussion` block carries no `feed`, hid every logged call, meeting and email.

The feed's `showCompleted` filter now keeps a `task` item that carries that pointer: the same items the timeline already gives a **View source** link. `showCompleted` still hides a `completed` row with no pointer, such as a finished task, while it is off. A logged interaction stays a `task` item, so `types: ['task']` and `filterMode: 'tasks_only'` still list it, and a page that sets `showCompleted: true` renders exactly what it did before. The default record page is not changed and `showCompleted`'s default stays `false`.

This narrows one sentence of the objectui#12106 entry, which said a `completed` row an app inserts itself stays hidden by default: one that points at its source record now shows. The `record:activity` block's own read and the console record page's feed both run the same filter, so both change together. No export, prop or type changes.
