---
---

Test-only, no package released: `RelatedList.unmaterializedSort.test.tsx`'s case "keeps that button in
client mode" now awaits the object schema before it reads the `Total` sort button. Since
objectui#10728 the sort-button row reads the masked stamp, which covers every column until
`getObjectSchema` resolves, and the case gated only on the view type, which client mode reaches on the
first commit. So whether the button existed when it was read depended on scheduling; on one merge-queue
build it did not (objectui#10895). No source file changes.
