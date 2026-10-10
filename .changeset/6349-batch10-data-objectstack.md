---
'@object-ui/data-objectstack': patch
---

`ConnectionState` is re-exported from `@object-ui/types` instead of being declared a second time here (objectui#6349, batch 10). `@object-ui/collaboration` declared the same five states for `useRealtimeSubscription`, so both packages now publish the one declaration under the same name. The union is unchanged, and so are `getConnectionState()`, `ConnectionStateEvent` and every import of `ConnectionState` from this package.

No runtime behaviour changes.
