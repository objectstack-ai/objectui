---
'@object-ui/app-shell': patch
'@object-ui/react': patch
---

Lookup links on a record page and on a custom page now carry the console's base path, so the same link works from a left click, a new tab, a middle-click and a copied link (objectui#12233).

On a console mounted under a router basename, such as `/_console`, a lookup value rendered as an anchor whose href was the bare route `/apps/APP/OBJECT/record/ID`. On a record page this hit, for example, a lead's converted account or contact and its owner. The same held for a lookup, or a grid's link column, on a custom page. A plain left click worked, because the anchor hands it to the console router and the router adds the basename. Opening the link in a new tab, middle-clicking it or pasting a copied link sent the browser to the bare route on the server, which answered `ENDPOINT_NOT_FOUND`.

- `@object-ui/app-shell`: both record-link builders, the record page's and the custom page's, now give lookups an href that includes the router's basename. They read the basename from the router, so a console mounted at the root keeps the bare href. A left click still navigates inside the app, to the same record the href names.
- `@object-ui/react`: the documentation of `RelatedRecordActionsValue.recordHref` now says the value is a document href that carries the host router's basename, while `openRecord` navigates by the router path. The type is unchanged.

Nothing is added to or removed from any package entry.
