---
'@object-ui/app-shell': patch
---

Stop the Studio dataset-filter bridge from ERASING a stored filter when an edit
cannot be serialized (objectui#9372). Behaviour change, not just a fix: three more
operators are now STORED where they used to be dropped.

**The erase.** `groupToCondition` answers `undefined` both when the author CLEARED the
filter and when nothing survived serialization, and the inspector — which commits on
every change — treated the two the same. The host applies patches as
`{ ...draft, ...patch }`, so that commit SET `dataset.filter` (or a `measure.filter`)
to `undefined`, which is exactly the patch shape `objectChangePatch` uses deliberately
to erase it. Nothing errored.

Two ordinary gestures reached it. Switching the only condition's operator to one this
bridge did not map — `notContains`, `startsWith`, `endsWith` and `between`, all four
ordinary entries in this inspector's menu, none of them opt-in. And, needing no
operator at all, simply BLANKING the value of the only row: an incomplete row is
dropped by the same path, the last part goes with it, and the answer is `undefined`.

**The fix, unconditional and ahead of any per-operator question.** The two meanings are
now distinguished: a group that still holds rows commits NOTHING and the stored filter
is left alone; only a group with no rows — Clear all, or the last row removed — still
commits `undefined`, because that is the author's own gesture. An operator this bridge
cannot express is therefore inert, whichever operators it maps.

⚠️ Deliberately not "emit something anyway". A filter emitted in a spelling that means
something else is worse than one that was dropped, so the unmapped arm still drops.

**And three of the four are no longer unmapped.** `notContains`, `startsWith` and
`endsWith` now serialize to the spec's own `$notContains` / `$startsWith` / `$endsWith`
and read back as the operator the author picked. The comment calling them operators
"this dialect genuinely cannot express" was stale: `FILTER_OPERATORS` carries all four.
Each is backed by a conformance reading rather than a guess — the Filter Protocol's
canonical `FILTER_TEXT_CASES` covers all three, the spec's declared-type door passes
them over `text` and refuses them over `number` / `date` / `boolean`, and this builder
offers them only on its text bucket.

`between` stays unmapped, for a reason about this bridge rather than the vocabulary:
the builder pads a half-typed pair with an empty bound and the spec's comparand door
accepts `[1, '']`, so emitting it needs a both-bounds-present rule first. It is now
unmapped and inert instead of unmapped and destructive.

Forward note for anyone pinning stored filters: a dataset filter written by this
version may carry `$notContains` / `$startsWith` / `$endsWith`, which an older
app-shell reads as non-representable and degrades to "edit it in the Source tab".
