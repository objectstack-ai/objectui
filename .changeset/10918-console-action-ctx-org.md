---
'@object-ui/app-shell': patch
---

fix(app-shell): the shared console action runtime supplies the spec-declared `${ctx.org.*}` scope (objectui#10918)

`@objectstack/spec` declares `${ctx.org.id}` in an action's `target`, and lists the
interpolation scope as `ctx.user.*`, `ctx.org.*`, `ctx.recordId` and `ctx.selection`.
`useConsoleActionRuntime` published the active organization only under the undeclared
key `activeOrganization`, so the `org` the action runner interpolates from was empty. A
target such as `/apps/cloud_control/sys_organization/record/${ctx.org.id}` navigated to
`/apps/cloud_control/sys_organization/record/` with the id blanked out.

The runtime now also publishes the active organization under `org`, with the same fields
as before: `id`, `slug` and `name`. This covers actions run through that runtime: the
console's root action provider, object views, SDUI pages and declared action bars. There,
`${ctx.org.id}` resolves to the active organization's id. With no active organization it
still resolves to an empty string. The existing `activeOrganization` key is unchanged.
