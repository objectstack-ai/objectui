---
'@object-ui/core': patch
---

The retired-`sort` refusal no longer prescribes metadata the spec rejects (objectui#9031).

`convertSortToQueryParams` refuses the retired string `sort` clause out loud, and the
diagnostic it prints is the text an author reads at the moment they are ALREADY being
corrected. It ended by telling them "`order` is optional and means `'asc'`". It is not
optional: `SortConfig.order` is required on the interface, on its zod mirror, and on
`@objectstack/spec`'s `SortItemSchema`, which refuses an entry without it. An author who
followed the correction verbatim was refused a second time — at publish, by a different
door, with no hint that the advice itself was wrong.

The repair is not "delete the sentence". A missing `order` genuinely IS read as ascending
by this renderer — a real runtime tolerance, documented as `normalizeSortEntries`' rule
since objectui#8973, and true because types are erased and an entry that arrives without
`order` still has to mean something. The message now keeps BOTH truths and stops stating
the runtime tolerance as an authoring permission: it asks for both keys on every entry,
names the three faces that require `order`, and says the tolerance is a runtime reading
rather than permission to omit the key.

**Wording only — no behaviour moved.** The same inputs are refused, on the same
`console.error` channel, returning the same `undefined`; the array arm lowers unchanged.
Pinned by reading the ACTUAL emitted message and feeding the entry it prescribes back
through `SortItemSchema` from the installed `@objectstack/spec`, so the pin fails if
somebody shortens the example the diagnostic quotes rather than only if somebody edits
prose.
