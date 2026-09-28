---
'@object-ui/app-shell': patch
---

fix(app-shell): console actions supply the spec-declared `${ctx.org.*}` scope (objectui#10918)

`@objectstack/spec` declares `${ctx.org.id}` in an action's `target`, and lists the
interpolation scope as `ctx.user.*`, `ctx.org.*`, `ctx.recordId` and `ctx.selection`.
The console's action contexts never carried `org`, so the `org` the action runner
interpolates from was empty. A target such as
`/apps/cloud_control/sys_organization/record/${ctx.org.id}` navigated to
`/apps/cloud_control/sys_organization/record/` with the id blanked out.

Two providers were missing it:

- `useConsoleActionRuntime`, the shared runtime behind the console's root action
  provider, object views, SDUI pages and declared action bars. It published the active
  organization only under the undeclared key `activeOrganization`.
- The record page's own action provider in `RecordDetailView`, which carried only
  `record`, `objectName` and `user`.

Both now publish the active organization under `org`, with the fields `id`, `slug` and
`name`, through one shared projection. `${ctx.org.id}` in a console action target
resolves to the active organization's id. With no active organization it still resolves
to an empty string. The existing `activeOrganization` key on the shared runtime is
unchanged, and the record page gains no key besides `org`.
