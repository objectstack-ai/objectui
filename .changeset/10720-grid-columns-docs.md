---
'@object-ui/layout': patch
---

`ResponsiveGrid`'s component docblock no longer attributes its column map to the
spec's retired `BreakpointColumnMapSchema` (objectstack#11027 retired it; objectui#7580
re-homed the six-key shape as this package's own `BreakpointColumnMap`). The docblock
now names that local type. Text only: no member is added and no behaviour changes.
