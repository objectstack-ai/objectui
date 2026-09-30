---
'@object-ui/console': minor
---

Framework navigation can now reach the console pages that the retired System Hub card wall used to be the only link to (objectui#10520).

Navigation reaches a console page only through a `type: 'component'` item whose `componentRef` is a component-registry key, never through a console path. The console registers three new keys:

- `audit:log` renders the Audit Log page. It stays beside the `sys_audit_log` object view because its detail drawer pretty-prints the before and after JSON of a change, which the object's record page shows as raw text.
- `ai:approvals` renders the AI Approvals page, which lists the whole AI pending-action queue.
- `developer:integrations` renders the Integrations & APIs page, which shows the environment's REST base URL, the generated REST endpoints of each business object and a cURL sample that sends the `x-api-key` header.

The keys are additive. `/apps/:app/system/audit-log`, `/apps/:app/system/ai-approvals` and `/apps/:app/developer/integrations` still render their pages, so bookmarks and deep links keep working. The navigation entries that name the new keys belong to the framework, not to this package.

**Breaking:** the Developer Hub page and its route, `/apps/:app/developer`, are removed. The hub was a wall of four cards, and each card's destination is now a registry key: `developer:api-console`, `developer:flow-runs` and `developer:public-forms`, which the framework's Studio app already names in its Developer group, and `developer:integrations`. A bookmark to `/apps/:app/developer` no longer shows the hub. Inside an app it now reaches the generic object route, which answers that no object named `developer` exists. With no apps configured it lands where it did before this change. The four routes under `/apps/:app/developer/` are unchanged.
