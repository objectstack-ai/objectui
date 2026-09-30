---
'@object-ui/plugin-view': patch
---

With a `page` record surface and no `onNavigate` handler, `ObjectView`'s New button, a row click and Edit now open the record form on the drawer (objectui#11015).

With no authored `layout`, the record surface is derived: `page` on a mobile viewport and on an object with at least `RECORD_SURFACE_PAGE_THRESHOLD` authorable fields. A page hands the record to `onNavigate`, and the registered `object-view` renderer has none, because a JSON schema cannot carry a function. New, a row click and Edit therefore opened nothing there. They now open on the drawer, the surface a page already took for New under a `split` or `popover` navigation (objectui#10975). An explicit `layout: 'page'` without `onNavigate` takes the same fallback. A `page` with an `onNavigate` handler still hands create, edit and view to the router, as before. The README and the plugin-view docs page now also say that under a `drawer` or `modal` navigation, the create form opens on that navigation's surface.

`Clause-②: no` — no declared type, accepted key or published export moves.
