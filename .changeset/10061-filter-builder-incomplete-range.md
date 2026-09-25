---
'@object-ui/components': patch
---

fix(components): a half-typed `between` range in the filter builder shows itself as
incomplete instead of being dropped with no signal (objectui#10061)

Ruling batch #146 item 5 letter A (objectstack#18012) declares that while one bound of a
`between` pair is blank the condition is incomplete — **not emitted, and shown as
incomplete in the UI**. The first half has been true since objectui#5025: every write
path folds the row through the builder's own arity-aware `isFilterValueComplete`, so a
range with one blank bound never reaches a live query or a stored view. The second half
was unbuilt. An author who typed one bound saw their value sitting on screen while the
row silently counted for nothing — the range was gone from the query and nothing said so.

The blank bound of a half-filled pair now carries `aria-invalid` and an
`aria-describedby` description naming the side that is missing ("To is required"), plus a
destructive border so the state is visible and not only announced. The description reuses
the shared `validation.required` key rather than declaring a new one, so it is already
translated in every pack.

⛔ This is a diagnostic, never a refusal. The completeness rule is unchanged, nothing
gates on the marker, and the other rows of the group keep applying — an incomplete row is
a UI state, not an error that blocks the filter.

What does NOT carry the marker: a complete pair; a row whose bounds are both blank, which
is the untouched shape `Add filter` draws and is no more half-written than an `equals` row
with no value yet; and any non-pair operator.

⚠️ A blank bound is not a zero bound. `0` is a legitimate lower bound on a number column
and `''` is an unfilled one, so `[0, '']` is marked on its upper bound and `[0, 10]` is
complete and marked nowhere. Reading the bounds for truthiness instead would mark the `0`
the author had just typed and leave the blank side clean — the pins for that distinction
sit beside the ones for the marker itself.
