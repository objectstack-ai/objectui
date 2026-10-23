---
'@object-ui/app-shell': patch
---

An action run from a record page's action bar with an `onSuccess.navigate` to a path with no app segment opens that page in the record page's app (objectui#13396).

The record page mounts its own action provider, and its navigator still handed such a path to the router unchanged, so `onSuccess: { navigate: '/crm_opportunity/${result.id}' }` landed on Home there even after objectui#13379 fixed the same hop elsewhere in the console. The record page's navigator now sorts the path the way the console action runtime does and hosts it under the app in the record page's URL, opening `/apps/APP/crm_opportunity/...`.

These are unchanged: a path that already names its app (`/apps/APP/...`), an external URL, a `mailto:` address, a `./` path, and a console route outside an app (`/forms/NAME`, `/home` and the other top-level routes).
