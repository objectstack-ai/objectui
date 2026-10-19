---
'@object-ui/components': patch
'@object-ui/app-shell': patch
---

`page:tabs` probes a related list's badge count from the record the record context names (`recordId`, the route's id on a record page) instead of the id inside the loaded row, so on a record open the badge probes go out beside the record read rather than a wave after it (objectui#13010). A list behind a `visibleWhen`, or in a tab whose own `visibleWhen` decides it, still waits for the record body, since its gate reads it.
