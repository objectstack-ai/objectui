---
'@object-ui/core': patch
'@object-ui/components': patch
---

One `titleFormat` interpolator for the record title (objectui#10447, objectui#10446).

`@object-ui/core`: `formatTitleTemplate` now judges a placeholder empty the way `recordDisplayValueAt` does: trim, then empty. A whitespace-only value used to count as resolved, so `{contract_no} - {name}` with a blank `name` rendered `HT-2026-003 -` in `formatTitleTemplate` and in `getRecordDisplayName`'s `titleFormat` rung, and so on every surface backed by that resolver. It now renders `HT-2026-003`. Both functions run one shared implementation of the rule, so a resolved placeholder renders the same trimmed display string `recordDisplayValueAt` returns. The exported signatures are unchanged.

`@object-ui/components`: the record page H1 (`page:header`) renders its `titleFormat` rung through core's `formatTitleTemplate`, the function `getRecordDisplayName` and `record:details`' H1 dedupe already use, instead of its own interpolation and separator cleanup. Visible changes on that rung:

- An expanded lookup token renders its display name: `{account} - {deal_no}` reads `Acme - Q3-042` where the H1 used to drop the lookup and read `Q3-042`, so `record:details` no longer prints the row it wrongly treated as distinct from the heading.
- A comma left by an empty placeholder is stripped: `{deal_no}, {code}` with no `code` reads `Q3-042`, not `Q3-042,`.
- A template none of whose placeholders resolves no longer shows its literal text (`Session — {user_id}` with no user used to read `Session`); the H1 walks on to the next rung, as `getRecordDisplayName` does.
- A select token still reads as its translated option label: the label is applied to a copy of the record before core renders it.

The rungs' order is unchanged. `page:header`'s own `title` and `subtitle` templates keep their existing interpolation.

This supersedes how two earlier changesets, still pending in the same release, describe the `titleFormat` rung; each now carries a dated note naming this card. objectui#9436 (the declared pointer outranks `titleFormat` in `page:header`) said the template kept the header's own interpolation. objectui#9174 (`interpolate()`'s no-token fast path) listed the record-title `titleFormat` among `interpolate()`'s callers. Both describe the header as it was at their change; from this release the rung renders through `formatTitleTemplate`.
