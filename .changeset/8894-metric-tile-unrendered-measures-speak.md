---
'@object-ui/plugin-dashboard': patch
---

A dataset-bound metric tile now warns when it drops measures it was told to show
(objectui#8894).

Declaring three measures on a `metric` / `kpi` / `gauge` / `solid-gauge` / `bullet`
widget was legal until `@objectstack/spec` 17.5.0, which refuses a second measure on
that family at its door; a document stored before then still reaches the tile. So does
a widget with no dimensions whose type does not render several measures. The query
runs every declared measure, and `DatasetWidget`'s tile rendered the first and stopped
there in silence: no warning, no console message, no visual tell. A tile answering a
narrower question than its metadata asked read as a finished product, which is the
hard part of the defect — not the numbers that never appeared. That is the ADR-0049
declared-but-unenforced shape, closed here the same way `warnSuppressedListNav`
(ADR-0047, objectui#2338) closes it for a suppressed list-view control.

**Nothing renders differently on the tile.** Its markup is byte-for-byte what it was,
the measures after the first are still dropped, and a tile declaring exactly one
measure says nothing at all. Rendering `values[1..]` on a tile is not part of this
change: ruling D on objectui#8894 judged the protocol wrong for the metric family and
narrowed the spec instead.

The warning names the widget, its dataset, the measures it renders and each measure
it queried and never displayed, and points to the spec's ADR-0087 replacement for a
one-number tile with several measures. Its wording is deliberate: the dropped
measures are **queried and then never displayed**, not "ignored". They are computed
by the server, they join the widget's refetch signature, and `options.sortBy` accepts
any of them — which on a `metric`-typed widget that also declares dimensions decides
which row is read. Only the display drops them.
