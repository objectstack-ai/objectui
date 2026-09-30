---
'@object-ui/plugin-detail': minor
---

feat(plugin-detail): row caps on `record:activity`, `record:history`, `record:chatter` and `record:discussion` admit only a positive integer number, and a refused one warns

`@objectstack/spec` declares `limit` on `RecordActivityProps` (which is also
`RecordChatterProps.feed`) and on `RecordHistoryProps` as
`z.number().int().positive()`, and refuses a string, a boolean or an array
outright. The renderers used to run `Number(value)` before their integer check,
so they also read `'5'` as 5, `' 5 '` as 5, `'0x10'` as 16, `true` as 1 and `[7]`
as 7: a second accepted set, wider than the contract (objectui#10145, ruled
STOP).

Both resolvers (`normalizeLimit`, shared by activity, chatter and discussion,
and `normalizeHistoryLimit`) now admit only a value whose type is `number` and
which is a positive integer. Every other authored value falls back to the
block's default (20 for activity, chatter and discussion; 50 for history). The
renderer then logs one `console.warn` that names the block and spells the raw
value with its type (for example `declared limit: "5" (string)`). The warning
also fires for the fractional, zero, negative, `NaN` and infinite values these
blocks already refused silently. That matches the "always warn" ruling on
objectui#10097 and the three objectui#9925 read points. An absent `limit` is not
a refusal and stays silent.

**Migration.** Stored metadata that spells a row cap as a string (for example
`limit: '5'`, or `feed: { limit: '5' }` on a chatter or discussion block) now
drops to the block's default and warns in the console, where it used to be read
as 5. Write the number instead (`limit: 5`). Publishing such metadata was
already refused by the spec, so this affects only bodies stored before that
check, or written around it.
