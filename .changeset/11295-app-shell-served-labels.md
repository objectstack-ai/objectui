---
'@object-ui/app-shell': patch
---

fix(app-shell): a served dashboard and a served list view are named as served, on the dashboard page, the view tab and the breadcrumb (objectui#11295)

The server translates `/meta/dashboard` and `/meta/view` documents for the request's
locale. Since objectstack#20680 and #20731 it also keeps a published edit over the
packaged catalog. The console then translated those served labels a second time
through the client bundle, and the bundle won. Measured on objectstack#20730: a
published `In Progress (edited-20730)` view drew `进行中` on the `zh-CN` tab and
breadcrumb, and a published widget title drew `Total Users` / `用户总数`.

The fixes:

- **The dashboard page.** `DashboardView` draws the served dashboard's `label` and
  `description` as given, and passes `localized` to `DashboardRenderer`, so the
  widget titles, descriptions and sub-captions are drawn as served too.
- **The view tabs.** The desktop and mobile view switchers, and the record page's
  way-back label, draw a view's label as given when the `/meta/view` read served
  that view. Any other view still goes through the bundle, because no server
  translated it. That covers a view embedded in the object document (the server's
  object translator does not translate `listViews`) and a view derived on the
  client.
- **The breadcrumb.** A view is now matched by `resolveViewId`, the matcher the
  object page opens it with. Before, a bare `/view/in_progress` URL missed the
  qualified `showcase_task.in_progress` view and drew the humanized slug. A served
  view, and a served dashboard, are now named as given.
