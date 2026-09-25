---
'@object-ui/plugin-detail': patch
---

fix(plugin-detail): feed diagnostics name the block that carries the bad value

`record:activity`, `record:chatter` and `record:discussion` share one feed
pipeline, and its author diagnostics for an unrecognised `filterMode`, an
unrecognised or non-array `types`, and a `types` kind nothing produces were
hard-prefixed `[record:activity]` and warned once per offending VALUE. So a bad
`feed.filterMode` or `feed.types` on a chatter or discussion block was reported
under another block's name, and the same bad value on two block kinds on one
page warned once in total: the second block's author was never told.

Each of those warnings is now prefixed with the block it was authored on, and
warns once per (block, value): the same bad value on two block kinds warns once
under each name, and the same block with the same value still warns once
however often it re-renders. The block name is a required argument of the
shared pipeline, so no caller can inherit another block's name by default.
Nothing that renders changes.

The `sys_activity` row-type warning is unchanged: it reports a value in the
data, not a member an author wrote on a block.
