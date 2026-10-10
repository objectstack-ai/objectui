---
'@object-ui/data-objectstack': patch
---

Doc comments only. `UserDataAdapter` now carries the contract notes `@object-ui/app-shell` kept on its own copy of the interface: implementations must be safe to call concurrently and should never throw, so the hosting provider can degrade to localStorage when the backend fails. `@object-ui/app-shell` now re-exports this declaration instead of declaring a second one (objectui#6349, batch 9). The type and its members are unchanged.

No runtime behaviour changes.
