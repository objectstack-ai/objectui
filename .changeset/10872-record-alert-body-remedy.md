---
'@object-ui/types': patch
---

`record:alert`: a `body` written directly on the node, rather than inside `properties`, is now refused with a pointer to `properties.body`, where the banner's message text lives (objectui#10872, batch 3). The refusal used to be `BaseSchema`'s objectui#6771 message, which sent the author to `children`: a key this block renders nothing from, and which its arm refuses (objectui#9256).

- Before: `{ "type": "record:alert", "body": "Verify your email" }` was refused at `body` with "Did you mean `body` → `children`?".
- After: the same document is refused at `body` with "Did you mean `body` → `properties.body`?", and the message spells the document to write: `{ "type": "record:alert", "properties": { "body": "…" } }`.

**What does not change: which documents parse.** A flat `body` on `record:alert` was refused before and is refused now, with the same issue code (`invalid_type`) at the same path, by `safeValidateSchema` (and so by `objectui validate`) and by the strict authoring face. `properties.body` parsed before and parses now. Every other node keeps its `body` refusal as it was.

Migration: if you followed the old message and moved an alert's text into `children`, move it to `properties.body`. A `children` on `record:alert` is refused, and nothing renders it.
