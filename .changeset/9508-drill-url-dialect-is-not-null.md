---
'@object-ui/app-shell': minor
---

The drill `filter[...]` URL dialect can spell IS NOT NULL (objectui#9508).

`filter[<field>][null]` now carries a DIRECTION rather than a flag: `=true` is
is-null exactly as objectui#9159 shipped it, and `=false` is is-not-null. The
write side reads both producer keys `convertFiltersToAST` lowers onto that pair
— `$null` verbatim and `$exists` inverted — so the three spellings that
previously vanished (`{ $exists: false }`, `{ $null: false }`, `{ $exists: true }`)
now reach the destination list as the condition the converter lowers them to,
instead of the drill degrading to a superset scoped by everything EXCEPT the
condition the user clicked. The chip for the new direction hands out the filter
builder's existing `isNotNull` operator key, which every locale pack already
translates; the prefix delete and "Save as view" fold cover it without a new
listing.

⚠️ objectui#9159 ruled `[null]=false` deliberately NOT an operator, on the stated
premise that the dialect could not WRITE one and a read-side operator would have
had no producer. This change supplies that producer in the same commit, so the
premise is discharged rather than overridden.

⚠️ Latent surface, not a live regression: the dataset drill's own click context
(`buildDatasetDrillFilter`) still emits `{ $null: true }` and nothing else, so no
machine producer on that path reaches the new spellings — re-measured, and pinned
so it reddens if that stops holding. The reachable route is an AUTHORED widget
filter. Every spelling that worked before is written byte-identically.
