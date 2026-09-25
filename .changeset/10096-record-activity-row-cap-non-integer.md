---
'@object-ui/plugin-detail': patch
---

`record:activity` refuses a NON-INTEGER row cap instead of flooring it
(objectui#10096).

`@objectstack/spec` declares this block's member a positive integer —
`RecordActivityProps.limit` is `z.number().int().positive().default(20)`, described
there as "Number of items to load per page" — so a fractional cap is a value the
contract refuses. `normalizeLimit` nevertheless read `Math.floor(Number(value))` and
then admitted anything finite and positive, so an authored `limit: 2.5` came back as
**2**: a two-row feed the author never asked for, with no cause named anywhere.

It now falls back to this block's default of 20, silently, which is the answer its
sibling `record:history` gives through `normalizeHistoryLimit` (objectui#10093).
`Number.isInteger` replaces `Number.isFinite` and nothing else, so `0`, a negative,
`NaN`, both infinities, an absent value and a non-numeric string keep answering 20
exactly as before; a usable cap still passes through unchanged and a numeric string
still resolves (`'5'` is still `5`). What narrows is the admitted value set, not how a
node's value is read. `record:activity`'s default of 20 and `record:history`'s of 50
are unchanged and still differ deliberately.

`record:chatter` and `record:discussion` resolve `feed.limit` through the same
function — `RecordChatterProps.feed` is `RecordActivityProps`, the same declared
member — so they get the same refusal.

What an author sees change: a record page whose activity, chatter or discussion block
declared a fractional cap showed a floored window (`2.5` → two rows) and named no
cause; it now shows the block's default of 20.

The `Math.max(1, Math.floor(pageSize) || …)` clamp inside `applyFeedConfig` is
unchanged and settled as an internal clamp rather than the same defect: `pageSize` is
not an authored member but the paging window, computed at both call sites as
`limit * (extraPages + 1)` over an already-normalized limit, so every value reaching it
is a positive integer on which all three of its arms are the identity.
