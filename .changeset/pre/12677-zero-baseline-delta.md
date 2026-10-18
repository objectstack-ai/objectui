---
'@object-ui/plugin-dashboard': patch
---

A period-over-period delta from a zero baseline no longer claims "100%" (objectui#12677).

A metric whose comparison window was 0 drew "↑100% vs previous period" when the current value was anything but 0. Going from 0 to 10 is not a 100% increase: a percent change from zero is undefined. The delta now keeps its arrow and draws an em dash in place of the number, on every surface that shows one: the dataset metric tile, the cross-tab's in-cell comparison, and the `object-metric` tile. `0 → 0` still reads a neutral `0%`, and a non-zero baseline keeps its percentage. The spec declares no marker for "new from zero", so the face is a symbol and no locale pack changes.

`MetricWidget` gains a host-only `derivedTrend` prop, the `compareTo`-derived trend whose `value` may be `null`; it replaces `trend` when set. It is not a node key, and the authored `trend.value` stays a number.
