---
'@object-ui/app-shell': minor
---

The console's assistant dock binds its build conversation to the app you are in
(objectui#10926).

Inside an app whose package is not a `com.objectstack.*` platform built-in, a dock
whose agent resolves to `build` now keys its conversation `app:PKG:build` — the key
the Studio copilot and `/ai/build?package=PKG` already use — so the three show one
thread. The dock's header chip and empty state name the app instead of reading
"New app", and each build request carries the app's package as `context.packageId`,
so the agent no longer has to infer which app to edit. The dock's "Open full page"
button opens `/ai/build?package=PKG` for such a thread.

Unchanged: an `ask` dock keeps its app-less thread; inside a `com.objectstack.*`
app, or with no current app, a build dock keeps the product-only thread; and bare
`/ai/build` still resolves that product-only thread. The product-only thread is
never cleared — it stays listed in the `/ai` sidebar, and a dock entering an app
adopts it only when its own history is bound to that app (the same check the
`?package=` entry already applies).
