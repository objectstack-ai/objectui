---
'@object-ui/app-shell': patch
---

A compact record-preview card for any `(object_name, record_id)` pair, kept inside the package for the approval surfaces to compose (objectui#12029, the first child of objectui#2763).

The card resolves the target object's definition and draws the record the way the record page's header draws it: the title from the shared record-title ladder (`getRecordDisplayName`), the object's label above it, and the object's highlight fields (`highlightFields`, else the same derivation the record page uses) through the record page's own highlights strip. A field the loaded permission policy denies is not drawn and is not expanded.

It has four states:

- **Loading** while the definition or the record read is in flight.
- **Readable** when the read returns the record.
- **Unreadable** for every other answer: no definition, no record, a refused read or a failed one. All of them render the same card, with the Approvals Inbox's cause-free sentence (`approvalsInbox.recordUnresolvable`), so it never says whether the record was deleted or is hidden from the viewer.
- **Absent** when the pair names no record. It renders the empty-value dash and reads nothing.

Cost: one definition read per object, shared by every card of that object through the metadata provider's cache, and one record read per card. The card re-reads in place when the record is invalidated.

No surface uses the card yet. **Clause-②: no.** Nothing on the package entry changes: the card is not exported, registers no component type, and adds no language-pack key.
