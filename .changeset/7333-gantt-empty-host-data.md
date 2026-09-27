---
'@object-ui/plugin-gantt': patch
---

`ObjectGantt` no longer treats an EMPTY host `data` array as the rows it was handed (objectui#7333).

`ObjectGantt` read a host `data` prop at two places, and both accepted `[]`. The
reload's short-circuit tested `data && Array.isArray(data)`, and an empty array
is truthy, so the chart adopted it and returned before its own query. The gating
flag tested `Array.isArray(data)` alone, so the same array also switched off the
object-schema gate and the data-invalidation subscription of that query. A gantt
whose `data` names its own source, for example `{ provider: 'api', read }`,
therefore painted an EMPTY chart whenever a host handed it an array it had not
filled yet.

Both places now read one predicate. A host `data` array is adopted only when it
has rows. An empty one reads as "no host rows yet": the chart queries its own
source, exactly as it does with no host array at all, and adopts the host's rows
when they arrive.

Who can reach this: the registered `object-gantt` renderer still forwards no
host prop, and `ObjectGanttProps` does not declare `data`, so only a caller that
renders `ObjectGantt` directly and spreads `data` in was affected.
