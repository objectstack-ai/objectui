---
---

Test-only change: the last three `object-master-detail-form` registry inputs,
`dataSource`, `details` and `fields`, become per-block member pins. Their
`MEMBER_PIN_EXEMPTIONS` entries are deleted in the same change, and
`MEMBER_PIN_EXEMPTION_CEILING` follows down to the new count (objectui#8071
slice 18, criterion from objectui#8068). This closes the block. The generic
`AWAITING_A_PIN` reason is deleted with its last entries. The one exemption
left, `record:related_list.actions`, carries a reason of its own and is not
touched.

The pins constrain what the RENDERER reads:

- `details`: a member is a detail-collection object. Five of its members reach
  the line grid through one hand-written object, four of them renamed, and that
  object is pinned as an exact key set. The members also address the atomic
  batch (each line a create on `childObject`, linked by `relationshipField`,
  with `totalField` summing `amountField` onto the parent leg) and the edit-mode
  line read. With only `childObject` authored, the FK and the columns are derived
  from the child object.
- `dataSource`: the binding's `object` outranks a flat `objectName` and reaches
  the detail half as well: the derived child FK and the batch's parent leg both
  read it. Its `filter`, `sort` and `limit` never reach the child read. Beside a
  named view, a malformed binding `filter` withholds the whole form, so an
  unmapped member is still read.
- `fields`: a member is a bare parent field name drawn in authored order. A name
  the parent does not declare is dropped, including a detail column name, and
  `{ name }` is the same member. One member fact is recorded as behaviour and
  handed back as a finding: the key bounds what is drawn, not what the parent
  leg writes.

No published behaviour changes. Every changed file is a test file or the
console's test ledger, and no package entry imports any of them. No package is
released by this change.

Refs objectui#8071, objectui#8068.
