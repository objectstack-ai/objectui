---
'@object-ui/plugin-detail': patch
---

`record:history` refuses a row cap the contract rejects instead of repairing it
(objectui#10005).

`@objectstack/spec` declares this block's member a positive integer —
`RecordHistoryProps.limit` is `z.number().int().positive().optional()`, described there
as the `$top` of the self-fetch query with a renderer default of 50. Two values the
contract refuses were nevertheless reaching the adapter:

- an authored `limit: -5` came back as a **one-row** window. The old derivation ended in
  `|| 50`, which catches `0`, `NaN` and `''`, but a negative is truthy and survived it;
  the `Math.max(1, …)` at the wire then repaired it to `1` rather than refusing it.
- an authored `limit: 2.5` was forwarded **untouched** as a fractional `$top`.

Both now fall back to this block's own default of 50, silently, which is the answer its
sibling `record:activity` already gives through `normalizeLimit`. Absent, `0`, `NaN` and
a non-numeric string keep answering 50 exactly as before, a usable cap still passes
through unchanged, and a numeric string still resolves. `record:history`'s default of 50
and `record:activity`'s of 20 are unchanged and still differ deliberately.

What an author sees change: a record page whose history block declared a negative or
fractional cap showed one row (or an unpredictable window) and named no cause; it now
shows the default 50.
