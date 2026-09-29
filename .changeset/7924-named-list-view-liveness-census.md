---
---

Measure `NamedListView`'s per-member liveness and pin it (objectui#7924).

The declared set is now walked with the TypeScript parser rather than a regex,
the named-view read set is derived through every route from `schema.listViews`
to a named view (with every occurrence of that record classified, so a new
route fails instead of shrinking the reading), and each declared member is
pinned by name on its side of the partition — 6 read, 41 unread of 47 when this
entry was written; ⚠️ re-taken at objectui#8980, which declared the seventeen
members the protocol declares on this surface, so the partition is 21 read and
43 unread of 64 today — so a member moving between the two sets fails in either
direction.

⛔ Measurement only: neither declaration face moved, and the disposition for the
unread members (`?: never` tombstones vs. making the renderer read them) stays
with objectui#7928. Test only; no package is released by this change.

⚠️ **Dated note, 2026-09-28 — the partition has since moved to 43 read and 21
unread of 64 — objectui#7928 and objectui#10758.** Later in this same release
two changes moved the census this entry pins. objectui#7928 stopped reading a
named view's `options` bag, which the protocol's record refuses, so the
partition went to 20 read and 44 unread. objectui#10758 then made the host
delegation read the twenty-three protocol members of bucket ① of the
objectui#7924 ruling, which no route read off a named view, off the named view
first. So "the partition is 21 read and 43 unread of 64 today" above no longer
holds: at this note's date the census reads 43 read and 21 unread of 64. And
the disposition for the unread members no longer "stays with objectui#7928":
the director-seat ruling of 2026-09-16 on objectui#7924 decided it, and both of
its halves have landed in this release, the `?: never` tombstones
(`.changeset/7924-named-list-view-retire.md`) and the renderer reads this note
describes. The census in `object-view-unmirrored-keys-7779.test.ts` re-derives
the partition on every run. `.changeset/10758-named-view-protocol-members.md`
(PR objectui#10884) and `.changeset/7928-listviews-by-reference-fold.md` (PR
objectui#10821) state what ships; the text above is kept as the reading of this
change.
