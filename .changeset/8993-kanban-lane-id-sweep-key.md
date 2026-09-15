---
'@object-ui/plugin-kanban': patch
'@object-ui/types': patch
---

Fix `bucketCardsIntoColumns` double-bucketing every record on a board whose lane
ids are not strings (objectui#8993).

The function decided lane membership **twice**, with two key types:

- **injection** reads `groups[col.id]`, and a property read coerces its key — a
  lane `{ id: 1 }` correctly picks up the group stored under `'1'`;
- **the leftover sweep** (objectui#2792) built its known-id `Set` from the RAW
  `col.id` and filtered `Object.keys(groups)`, which are always strings. Since
  `new Set([1]).has('1')` is `false`, every record the injection had just placed
  was swept a second time into the trailing "Uncategorized" lane.

⇒ A numeric-id board rendered **every card twice**. Silent by nature: the board
draws, only the totals fail to reconcile.

The repair is on the sweep side — the set now holds the same key spelling the
property read uses, so both decisions agree. ⛔ Not on the injection side:
making that read strict would break the coercion lanes depend on, and the string
control could not catch it. A symbol id is the one key a property read does not
stringify, so it is kept as-is rather than pushed through `String()`, which
throws on symbols; `Object.keys` never yields a symbol, so such a lane keeps the
reading it has today.

**Visible change.** A board whose metadata already hits this — a picklist whose
option `value` is a number, which reaches the renderer as a lane id through a
path no schema guards — showed each card twice, once in its lane and once in
"Uncategorized". It now shows each card once. The trailing lane still collects
records whose group value matches no lane, which is objectui#2792's job and is
pinned alongside the repair.

`@object-ui/types` carries prose only: the lane-id `describe()` and TSDoc that
stated the double-render as current behaviour now state it as repaired. The
authored `id` stays `string` — one declared lane-id type beats two.
