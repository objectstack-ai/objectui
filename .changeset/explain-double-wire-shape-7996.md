---
---

Test-only change (objectui#7996): the `security/explain` double in
`record-details.hideEmptyRetired-7129.test.tsx` now answers in the two response
shapes the explain hooks actually read — `{ record: { visible } }` for a single
`recordId` and `{ records: [{ recordId, visible }] }` for a batched `recordIds`
— instead of `{ allowed: true }`, a key neither hook reads. No published
behaviour changes: no `src/` production file and no published-contract field
moved, and the file's assertions are unchanged.
