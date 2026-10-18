---
'@object-ui/app-shell': patch
---

perf(app-shell): a console open reads the current app's objects, not the whole object registry (objectui#12811)

Every console open used to request `GET /api/v1/meta/object` for every registered object (97 objects
and 745 KB on the measured backend), whichever app it opened. Opening an app's root or an object's
list now requests `GET /api/v1/meta/object?package=ID` with the package id the app's served item
carries. An object the route needs from outside that package is requested by name: the route's object,
the objects its lookup fields point at, the objects the app's navigation entries name in
`requiresObject`, and, while the command palette is open, the navigation's objects. The header's
view-tab labels and the bell's activity feed read the same scope, and `useObjectPresence` asks an
object by name inside such an app, until something loads the whole registry. Until those answers land, the route shows
its skeleton, never an empty list or a "not found".

What still reads the whole registry, as before:

- An app item that carries no package id, an app whose package holds no objects of its own (a platform
  app such as Setup, whose entries all open other packages' objects), and every route outside an app
  (the home page).
- A record overlay (`?recordId=`, `?form=`) and every record route: a record's related lists come from
  every object that points at its object, in any package.
- An object list whose views open records in an overlay the URL does not carry (`modal`, `split`,
  `popover`).
- Dashboards, reports, pages, search, Studio, the metadata admin and the app designer.
- An action that opens an object's form in a modal, when it opens: the form's subforms come from every
  object. The console no longer loads the whole registry for this at startup.

`useMetadata().objects` keeps its meaning: it is the whole registry wherever it is read. The package
read is refreshed and dropped with the `object` type (`refresh`, `invalidate`, an organization switch)
and is never served from a clock.
