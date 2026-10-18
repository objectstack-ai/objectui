---
'@object-ui/react': minor
'@object-ui/app-shell': patch
---

A page route reads the objects its page binds, not the whole object registry (objectui#12980, part 1).

Opening a page (`/apps/APP/page/NAME`) used to load every object definition (`GET /api/v1/meta/object`, 751 KB on the control plane), because the route, the page view and three page blocks read `useMetadata().objects`. Now:

- **`readObjectScope({ names })` with no `packageId` is a names-only scope** (`@object-ui/react`, `MetadataContextValue.readObjectScope`). Each name is read by name, with no package list. Only a scope with neither `packageId` nor `names` is the whole registry. This widens what the published contract accepts, which is why `@object-ui/react` is a minor bump.
- **A page route reads the objects its page definition binds**: the page's `object`, its interface source, and every `objectName` and `dataSource.object` on its blocks. They are read by name, beside the app's package list when the app names a package, or through the names-only scope when it does not. A page that binds no object, such as one whose data sources are all `api`, reads none. The chrome around the page gets the same scope.
- **An object a block asks about outside that set is read by name when it asks.** A link to it is drawn once the object arrives, and opening it navigates once the object is known.
- **The page blocks:** the interface list page reads its source object by name, `nav:menu`'s capability gate reads the objects its app's entries require by name, and `global:search` reads the registry only once the user types. A record overlay still reads the whole registry, because a record's related lists come from every object that points at it.

No export, prop or type member is added.
