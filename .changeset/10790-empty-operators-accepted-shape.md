---
'@object-ui/fields': patch
---

fix(fields): "Is empty" / "Is not empty" in the filter-condition widget store a criteria the objectstack filter faces accept

`FilterConditionField` (the `filter-condition` widget behind `relatedListFilter`, a
roll-up's `summaryOperations.filter` and `sys_sharing_rule.criteria_json`) stored
"Is empty" as `{ FIELD: { $in: [null, ''] } }` and "Is not empty" as
`{ FIELD: { $nin: [null, ''] } }`. A `null` list member is refused by
`@objectstack/spec`'s comparand-shape face (`assertListComparandShapes`,
`INVALID_FILTER` / 400) in every position, so a related list, roll-up or sharing
rule authored with either operator failed whenever it was evaluated.

They now store the spelling that refusal prescribes, with the same meaning — no
value OR the empty string, and its complement:

- "Is empty": `{ $or: [{ FIELD: { $in: [''] } }, { FIELD: { $null: true } }] }`
- "Is not empty": `{ FIELD: { $nin: [''], $null: false } }`

Criteria saved in the old shape still open in the builder as the same row, and
opening one rewrites nothing; the builder writes the new shape the next time any
row of that criteria is edited.

**Correction, 2026-10-03 (objectui#10813).** The two shapes above are not what this release
writes. Later in the same release the pair moved to the spec's one 「is empty」 operator:
"Is empty" stores `{ FIELD: { $empty: true } }` and "Is not empty" `{ FIELD: { $empty: false } }`,
whose meaning is the field's declared row of the spec's per-type table rather than "no value OR
the empty string" on every type. Criteria saved in either earlier shape still open as the same
row and are written as `$empty` on their next edit (`.changeset/10813-filter-condition-empty-operator.md`).
