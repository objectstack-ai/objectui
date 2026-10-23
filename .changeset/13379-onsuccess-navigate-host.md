---
'@object-ui/app-shell': patch
---

An action's `onSuccess.navigate` to a path with no app segment opens that page in the current app (objectui#13379).

`onSuccess: { navigate: '/crm_opportunity/${result.id}' }` used to land on Home: the console handed the path to its router unchanged, and under the `/_console` basename it matched no route. The console action runtime now hosts such a path under the current app, the same way an inbox notification link is hosted, so it opens `/apps/APP/crm_opportunity/...`. With no app current (on Home), it is hosted under the first app the user can open, as notification links are.

These are unchanged: a path that already names its app (`/apps/APP/...`), an external URL, a `mailto:` address, a `./` path, and a console route outside an app (`/forms/NAME`, which `type: 'form'` actions open, and `/home`, `/studio`, `/setup` and the other top-level routes). A `type: 'url'` action shares this navigator, so its app-relative paths are hosted the same way.
