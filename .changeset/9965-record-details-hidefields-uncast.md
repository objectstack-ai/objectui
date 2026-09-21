---
---

Internal only; nothing published changes.

`record-details.tsx` read `hideFields` through `(schema as any)` — the one key
of the four it casts that the mirror DECLARES
(`RecordDetailsComponentProps.hideFields`, aligned to `@objectstack/spec`
`RecordDetailsProps.hideFields`). A cast spends the declaration at the site it
exists for, so a wrong-typed use of the correct spelling was silent exactly
where an author's metadata arrives. The read is now un-cast; the other three
keys the file casts are not declared on the mirror, so their casts stay and are
ledgered with the condition that expires each exemption.

⛔ Declaring "not published" is a MEASUREMENT here, not a judgement. The package
was built twice, once from each side of this change, and its 116 published
files compared by content hash: 115 are byte-identical, including every emitted
JavaScript file and every `.d.ts`. The one that moves is
`renderers/record-details.d.ts.map`, a declaration source map whose position
table shifted because the repair added explanatory comment lines above the
read. No exported symbol, no emitted statement and no runtime behaviour moves —
a type assertion is erased before emit, which is precisely why this class of
defect needs a compile-time pin rather than a behavioural one.
