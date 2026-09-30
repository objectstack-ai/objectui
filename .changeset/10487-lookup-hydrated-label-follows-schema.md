---
'@object-ui/fields': patch
---

fix(fields): a lookup value hydrated from a bare id is labelled from the referenced object's schema once it arrives (objectui#10487)

A lookup that mounts already holding a value (an edit form opening an existing
record) fetches the referenced record to label its chip. It also asks for the
referenced object's schema, and nothing orders the two. When the record came
back first, the chip was labelled without the schema, on the `name` guess, and
it kept that label. The hydration cached a built option with its label frozen,
and the schema's arrival never rebuilt it. The dropdown, the read cell and the
record page read the object's declared `nameField` for the same record. So the
chip read `Acme` while its own dropdown option read `HT-001`, until the user
picked the record again, and a reload brought `Acme` back.

The hydration now keeps the fetched rows and builds no label. The chip's option
is derived from those rows on every render through the same `recordToOption`
call, with the same inputs, that the dropdown uses. So its label follows the
schema when it arrives. It also follows the permission policy in force: a field
the policy denies after the chip was labelled (a policy that loads late) leaves
the chip's label as it leaves the dropdown's. The record is still fetched once,
and no remount is involved. When
the schema arrived while the record fetch was still in flight, the fetch used to
be cancelled and issued a second time; it is issued once now.
