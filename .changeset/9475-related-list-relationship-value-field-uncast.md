---
---

`record:related_list` now reads `relationshipValueField` off its typed `schema`
instead of through `(schema as any)` (objectui#9475).

The key has been declared on the published mirror
(`RecordRelatedListComponentProps`) since objectui#9469/#8649, aligned to
`@objectstack/spec`'s `RecordRelatedListProps.relationshipValueField`, but the
renderer's own read unwrapped that declaration with a cast — so the read carried
`any` at the one site the declaration was added for. Measured with the
expression instrument (`getTypeAtLocation` on the read, not `getPropertyOfType`
on the binding, which unwraps casts): `any` before, `string | undefined` after.

**No package is released by this change.** Runtime behaviour is unchanged — the
renderer already applied the contract's `.default('id')` itself, and that
fallback is untouched — and the published type surface is unchanged, because
the declaration this repairs was already published. `as any` is erased by the
compiler, so the emitted module is byte-identical; the ablation legs on the pull
request show the same test file going red on the re-cast source and green on the
runtime legs either way.

A co-located pin guards the read, over a population derived from the contract's
own props schema rather than a written-down list, and ledgers the one cast this
file still carries over a declared key (`add`) with its measured reason.
