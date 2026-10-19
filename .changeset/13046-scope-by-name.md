---
'@object-ui/app-shell': patch
---

The console no longer reads the whole object registry before the first paint on two more routes (objectui#13046).

- **An object's route in an app whose package holds none of its objects.** Such an app (an app package that ships only the app, its objects living in other packages) used to fall back to the whole registry once its `meta/object?package=` read answered empty. Its object routes now read by name the route's object, its lookup and master-detail targets, and the objects the app's entries require (`requiresObject`); only the route's object holds the route. The app's root keeps the whole registry, as before.
- **A record route whose record page is declared.** When the record's object has a full record page (`type: 'record'`, the page the record route renders, or the one a named record page route names), the route reads the objects that page binds by name, the way a page route does, once the page list has answered. A record route with no declared record page, or a slotted one, keeps the whole registry: its synthesized page derives related lists from every object that points at the record's object.

Nothing is added to the package entry: no export, prop or type member.
