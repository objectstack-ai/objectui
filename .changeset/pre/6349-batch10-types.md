---
'@object-ui/types': minor
---

`ConnectionState` is a new export: the lifecycle state of one client connection, `'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'` (objectui#6349, batch 10). `@object-ui/data-objectstack` (its adapter's connection) and `@object-ui/collaboration` (`useRealtimeSubscription`'s socket) each used to declare these same five states. Neither of those packages depends on the other, and both depend on this one, so the one declaration now lives here and both re-export it under the same name.

Nothing is removed or narrowed. No runtime behaviour changes.
