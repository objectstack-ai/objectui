---
'@object-ui/app-shell': patch
---

Lookup links on a record page now carry the console's base path, so the same link works from a left click, a new tab, a middle-click and a copied link (objectui#12233).

On a console mounted under a router basename, such as `/_console`, a lookup value on a record page (for example a lead's converted account or contact, or its owner) rendered as an anchor whose href was the bare route `/apps/APP/OBJECT/record/ID`. A plain left click worked, because the anchor hands it to the console router and the router adds the basename. Opening the link in a new tab, middle-clicking it or pasting a copied link sent the browser to the bare route on the server, which answered `ENDPOINT_NOT_FOUND`.

The record page's record-link builder now gives lookups an href that includes the router's basename. It reads the basename from the router, so a console mounted at the root keeps the bare href. A left click still navigates inside the app, to the same record the href names. Nothing is added to or removed from any package entry, and the `recordHref` member's type is unchanged.
