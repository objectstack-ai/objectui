---
'@object-ui/plugin-timeline': patch
---

fix(plugin-timeline): an `object-timeline` block shows the rows of its current query, not an earlier answer that arrived late (objectui#10684)

`ObjectTimeline` numbers the runs of its fetch, but only its `error` writes read
that number (objectui#10663). The rows and the loading flag were written by every
run. When the query changed while a read was in flight (a new filter, sort or
object, or a data-invalidation re-read), the earlier answer could arrive after
the current one and replace the current rows. An earlier read that settled first
also cleared the loading skeleton while the current read was still in flight.

Only the current run writes the rows and clears the loading flag now. An answer
from a superseded run is dropped when it arrives. The current run still clears
the loading flag on every exit, including a failed read.
