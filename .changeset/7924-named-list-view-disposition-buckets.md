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

⚠️ **Dated note, 2026-09-28 — the unread members are now 21, partitioned
0 + 8 + 11 + 2 — objectui#7928 and objectui#10758.** Later in this same release
two changes moved the partition this entry pins. objectui#7928 stopped reading
a named view's `options` bag, which the protocol's record refuses, so `options`
joined the bucket of objectui-only members and the unread members became 44,
partitioned 23 + 8 + 11 + 2. objectui#10758 then made the host delegation read
the twenty-three protocol members of the first bucket off the named view first.
So "the **43** unread members partition **23 + 8 + 10 + 2**" and "the
disposition for the 43 unread members" above no longer hold: at this note's
date 21 members are unread, partitioned 0 + 8 + 11 + 2. The census in
`object-view-unmirrored-keys-7779.test.ts` re-derives the buckets on every run.
`.changeset/10758-named-view-protocol-members.md` (PR objectui#10884) and
`.changeset/7928-listviews-by-reference-fold.md` (PR objectui#10821) state what
ships; the text above is kept as the reading of this change.
