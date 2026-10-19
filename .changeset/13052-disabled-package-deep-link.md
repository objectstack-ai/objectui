---
'@object-ui/app-shell': patch
'@object-ui/i18n': patch
---

A deep link to an object read by name always leaves the "Opening your console…" splash (objectui#13052).

Opening an app route for an object outside the app's package (`/apps/APP/OBJECT`) reads that object by name. When the server refused it, the console waited on the boot splash for good:

- **A disabled package is an answer.** `404 OBJECT_PACKAGE_DISABLED` (the object exists, its package is disabled) now settles the route like a plain absence. The route draws the "Object Not Found" view inside the app shell with a sentence that names the disabled package. `404 RESOURCE_NOT_FOUND` draws "Object Not Found" as before.
- **A failed read has an exit.** A 5xx, a network drop, or a 4xx carrying a code this build does not know no longer holds the splash. The route draws a "Couldn't load records" state inside the shell with a Retry, which asks for the object once more. A failed read is not asked again on every render: Retry, a metadata refresh or an invalidation asks it again.

`isMetaItemAbsentError` (`@object-ui/data-objectstack`) still answers "absent" for `RESOURCE_NOT_FOUND` only; the console classifies the refusal at its own read site. One language-pack key is added, `console.objectView.objectPackageDisabled`, in all ten packs. Nothing is added to the package entry: no export, prop or type member.
