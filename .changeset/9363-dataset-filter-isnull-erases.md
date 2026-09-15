---
'@object-ui/app-shell': patch
---

Stop the Studio dataset-filter bridge from ERASING a stored filter when the author
picks `Is null` (objectui#9363).

`groupToCondition` had no mapping for `isNull` / `isNotNull`, so those rows fell
through to the unmapped-operator drop. A dropped last row makes the function return
`undefined`, and the dataset inspector commits on every change — so an author with a
working `dataset.filter` (or a `measure.filter`) who opened the filter popover and
switched the single condition's operator to **Is null** committed `undefined`, and the
persisted filter was destroyed. Nothing errored and the panel still showed the
condition. `Is null` is an ordinary entry in that menu, not an opt-in one.

Both directions now bridge the spec's `$null` predicate: `isNull` serializes to
`{ field: { $null: true } }` and `isNotNull` to `{ $null: false }`, and a stored
`$null` reads back as the operator the author picked instead of degrading the whole
filter to "edit it in the Source tab".

`$null` stays distinct from `$exists`: `isEmpty` / `isNotEmpty` are unchanged, because
the dropdown offers both pairs as their own rows and the spec's filter vocabulary
carries both predicates.

Operators this bridge still does not map are still dropped rather than emitted in a
spelling that means something else — that behaviour is deliberate and is now pinned
alongside the fix, together with the list of operators the menu offers and this bridge
cannot store (`notContains`, `between`, `startsWith`, `endsWith`), so the next unmapped
addition fails a test instead of erasing a filter.
