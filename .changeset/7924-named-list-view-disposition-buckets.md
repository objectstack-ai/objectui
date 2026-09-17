---
---

Derive `NamedListView`'s four disposition buckets against the protocol and pin
them (objectui#7924).

The liveness census answered "declared, and read off a named view?". The
disposition the card is waiting on turns on a second question the census never
pinned: does `@objectstack/spec` declare the member? That is what separates
"the renderer sources it from the wrong place" from "objectui invented a
spelling", and the 2026-09-16 ruling is written on that axis — in prose, with
no assertion that could fail.

Re-derived at test time, off the installed protocol schema, the declaration's
own AST and the runtime fold: the protocol declares **50** keys for a named
list view, **5** of them retirement tombstones refused by name, so objectui not
declaring those five is agreement rather than narrowness; objectui declares all
**45** live protocol keys, so the narrower-than-protocol direction is empty
today (it was seventeen before objectui#8980); and the **43** unread members
partition **23 + 8 + 10 + 2**, disjoint and exhaustive, so a member changing
bucket fails by name instead of staling a prose list. The strict protocol
value's unknown-key refusal through `.omit().extend().superRefine()` is now
executed under zod 4 with an accept control, rather than read off
`strictObject`.

⛔ Measurement only: no declaration face moved, and the disposition for the 43
unread members stays where the ruling put it. Test only; no package is released
by this change.
