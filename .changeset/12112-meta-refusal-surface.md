---
'@object-ui/app-shell': patch
'@object-ui/data-objectstack': minor
---

**A dashboard or a list view the server refuses you, opened by its URL, now says it was refused** (objectui#12112, the console half of objectstack#22611's ruling A).

Since objectstack#22731 the server applies a dashboard's and a list view's `requiredPermissions`: its dashboard and view lists carry only what you may open, and a by-name read of one you may not answers `403 PERMISSION_DENIED`. The console read only the lists, so a refused dashboard's URL showed "Dashboard Not Found", and a refused list view's URL silently showed the object's default view instead.

- **The dashboard page and the object's list page** ask a missed name by name. A `PERMISSION_DENIED` answer shows "You don't have access" with the server's own sentence, which names the item: `You do not have permission to open the 'NAME' dashboard.` (or `view`). Any other answer keeps today's face: "Dashboard Not Found", or the fall-back to the default view. Nothing is asked in draft preview, or by a host whose data source has no probe. The title reuses existing translations; no translation key is added.
- **`@object-ui/data-objectstack`: `ObjectStackAdapter.probeMetaItemAccess(type, name)`**, and its result type `MetaItemAccess`. It is `probeAppAccess` for any type the by-name meta route gates per caller, and it also returns the refusal's `message` with a `denied` verdict. `probeAppAccess` now delegates to it and answers as before.
- An object's own list view, served whole inside the object's metadata to a user who may edit the object, is still listed and opens. The server serves it to that user, and the console adds no rule of its own.
