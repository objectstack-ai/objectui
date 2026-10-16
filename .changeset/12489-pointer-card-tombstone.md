---
'@object-ui/app-shell': minor
---

The record details grid draws a platform-deleted pointer target as a tombstone in the declared option's label (objectui#12489).

The pointer face registered under `RECORD_POINTER_CARD_TYPE` is the caller `RecordPreviewCard` leaves "a deletion the platform asserts" to. When the pair it receives carries `deletedLabel` (the field's `referenceDeletedWhen` held on this row), it draws that label beside a wastebasket in the card's frame (`data-record-pointer="deleted"`), and does not mount the card: no read of the target, no definition read, no link, no record id. On the served approval request page, a request whose `cancel_reason` is `record_deleted` now shows "Related record deleted", or the localized label of that option, where it showed "This record cannot be opened". A target read that fails or answers no record still draws the card's cause-free text: only the declared assertion means deleted.

**Clause-②: yes (widening)**: the face draws one more state. No export, prop, type or language-pack key changes, and nothing narrows.
