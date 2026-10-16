---
'@object-ui/components': patch
'@object-ui/core': patch
---

An authored `view:calendar` or `view:timeline` node loads its plugin and renders the calendar or the timeline, and a console boot no longer logs the registry's race warning for those two keys (objectui#11680).

The console declares both views as lazy stubs, then registers a protocol placeholder for each protocol key nothing renders yet. The placeholder registrar asked the registry about loaded components only, so it read the two stubbed keys as free and took them, and the registry cleared the stubs under them. Until some other node happened to load the calendar or the timeline chunk, an authored `view:calendar` or `view:timeline` drew the dashed "Component Placeholder" box instead of the view. `registerPlaceholders()` and the eager palette placeholders now skip a key a pending lazy stub holds (`ComponentRegistry.hasLazy`). The key stays with the plugin that declared it, and `SchemaRenderer` loads that plugin the first time the node renders. A protocol key that nothing declares still gets its placeholder.

The registry's collision warnings now name a stub by the full type it declared. A stub found under its own namespaced key was named with its namespace written twice (`view:view:calendar`), and `register`, `registerLazy` and `unregister` compared ownership against that doubled spelling.

**Clause-②: no.** No export is added or removed, and no accepted input changes. The placeholder registrar is not exported, and the field the registry now records on a lazy stub lives on a type the package does not export.
