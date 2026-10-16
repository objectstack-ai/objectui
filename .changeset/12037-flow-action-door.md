---
'@object-ui/app-shell': patch
---

A console click on a declared `type: 'flow'` action now starts its flow through the action endpoint, `POST /api/v1/actions/:object/:action`, so the server-side gates that action declares apply to the click (objectui#12037).

Both flow-launch handlers used to start every flow through `POST /api/v1/automation/:flow/trigger`: the list and page runtime (`useConsoleActionRuntime`) and the record page (`RecordDetailView`). That route starts a flow by name, so the action's own `requiredPermissions` (ADR-0066 D4, whose console half only hides the button), its activation switch, its param contract and the caller-scoped load of its subject record never ran for the click.

- **Which door.** A click goes through the action endpoint exactly when its object and `name` resolve to a declared action of type `flow` with the same `target`, in the object metadata the console already holds. A refusal comes back with the endpoint's own code (for example `403 PERMISSION_DENIED` for a missing capability) and shows as the action's error toast. A paused screen run opens the flow runner as before and resumes under the declared `target`. A refused end and a failed run show as before.
- **What stays on the trigger route.** A flow start that names no declared action keeps the trigger route: an inline page button with no `name` or a non-matching one, and a dashboard header action. Such a start has no action gate to apply, and the trigger route refuses an elevated self-triggered flow just as the action endpoint does (objectstack-ai/objectstack#22424). An object-less declared action, and a standalone action row that no object definition embeds, are not in the object metadata, so a click on one keeps the trigger route, as every flow click did before.
- **A related list's toolbar flow action no longer sends the parent record's id.** On a record page, a child object's flow action launched from its related list's toolbar has no row. It used to be sent with the page's own record id against the child object. It now goes out with no record, as an object-level start. A row action still addresses the child row.

Nothing published changes: no export, prop or language-pack key is added.
