---
'@object-ui/react': patch
---

`ElementDataSourceGate`: a row cap the contract refuses is no longer counted as
"the component authored one" (objectui#9899).

The shared gate decides, per key, whether a component's own value should suppress
the one a bound saved view supplies. For `columns` it has always decided that by
CONTENT — an authored-but-empty list yields, because "supplying the columns is the
reason a view was named". For the row cap it decided by PRESENCE, so a value
`@objectstack/spec` refuses — `pagination.pageSize: 0`, a negative, a fraction —
counted as authorship and suppressed the view's legitimate cap.

**What an author saw.** Measured end to end on `list-view` rather than inferred: a
component carrying `pagination.pageSize: 0` under a view supplying `7` put
`$top: 100` on the wire — the renderer's own default, because that renderer already
refuses a non-positive page size. So the view's cap never reached the query and the
read was WIDER than the view asked for, in the one direction a named view exists to
prevent. The same branch feeds the flat `limit` key that `object-kanban`,
`object-timeline`, `record:related_list` and the form panels read.

After this change the view's cap is written, and the same fixture puts `$top: 7` on
the wire.

**The diagnostic moved with the decision.** Before this change the consuming
renderer was the one telling the author their `0` had been dropped. Now that the
gate substitutes a usable cap, that renderer correctly sees nothing to report — so
the gate states it instead, once per declaration, on the same `console.warn` channel
the renderers use. It names the refused value, the key it was written on, and the
cap used in its place. Exactly one message is emitted before and after; this is not
a silent substitution, and it is not a clamp — the author's number is refused, not
repaired.

**Unchanged:** a legitimate authored cap still wins over the view's, and an explicit
cap on the `dataSource` binding still wins over both.
