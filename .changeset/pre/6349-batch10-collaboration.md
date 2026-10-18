---
'@object-ui/collaboration': patch
---

`ConnectionState` is re-exported from `@object-ui/types` instead of being declared a second time here (objectui#6349, batch 10). `@object-ui/data-objectstack` declared the same five states for its adapter's connection, so both packages now publish the one declaration under the same name. The union is unchanged, and so are `RealtimeResult['connectionState']` and every import of `ConnectionState` from this package.

No runtime behaviour changes.
