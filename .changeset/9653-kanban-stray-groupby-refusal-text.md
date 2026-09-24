---
"@object-ui/types": patch
---

**The stray-`groupBy` kanban refusal no longer tells an author their view "never came through the validated path".**

The refusal an author meets for a view-level `kanban.groupBy` (objectui#8365) said
that a view carrying the key "never came through the validated path", and, in the
same message, that the key "rode this object's `.passthrough()`" into `ListView`
and changed the board. Only the second was true. Measured on the tree before the
refusal landed: `safeValidateSchema` accepted the key green in both nestings and
kept it, and `ListView` grouped the board by it. The protocol is what refuses the
key (`@objectstack/spec`'s strict `KanbanConfigSchema`); this package did not.

The false clause is gone. The message's explanatory tail now says what happened:
this package accepted the key until the refusal, kept by the kanban
configuration's `.passthrough()` or by the untyped legacy `options` bag, and
`ListView` let it override the lane resolved from `groupByField`. It also says
why the key is refused now: `ListView` drops it, so it is refused instead of
being kept and then ignored.

What is refused is unchanged: the same key at the same two paths
(`kanban.groupBy` as `invalid_type`, `options.kanban.groupBy` as `custom`), with
the same lead sentence and the same remedy. Only the explanatory tail of the
message changed.
