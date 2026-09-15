---
'@object-ui/types': minor
---

`EventHandlersSchema` is removed from `@object-ui/types` (objectui#6910).

**FROM** `EventHandlersSchema`, a `z.record(z.string(), z.function())` exported
from the zod base module and re-exported from the zod barrel, **TO** *nothing*.
There is no replacement export, and deliberately so.

**Nothing that worked stops working, because nothing could have worked.** Every
value the record accepted had to be a function, so no JSON document could ever
satisfy it, and nothing in this package composed it into a field. It could
therefore neither admit a correct authoring nor refuse a wrong one — an author
reading the published surface got no signal in either direction, which is the
shape ADR-0049 enforce-or-remove exists to delete. Ruled by the maintainer on
objectui#6124 (decision batch #8) and reconfirmed in batch #25.

**What to author instead.** Behaviour is authored as a NODE TYPE — an `action:`
node with a declared action, the spelling PR #6498 established. The per-node
`on*` handler keys that do exist are declared through `handlerKeyRefusal()`,
which refuses every value, an authored object and a live function alike, and
carries that same remedy in its own message. The function-valued face is a
TypeScript prop shape and is untouched by this change: the `EventHandlers`
interface is still declared and still exported.

**Not marked breaking, and that is a measurement rather than an assumption.** A
consumer census for this symbol scored zero live imports in each of objectui,
objectstack, cloud and hotcrm. The objectui and objectstack legs were re-taken
on this branch under a positive control that fires in the same corpus; the
cloud and hotcrm legs are carried forward from the published reading on
objectstack#15886 rather than re-taken here. That is a reading taken at this
commit and nothing re-derives it afterwards: a TypeScript consumer outside
those four repositories that imported the symbol gets a compile error naming
it, and the FROM/TO above is what such a consumer needs.

⚠️ **No gate reports a second export of this shape.** Both standing instruments
are structurally blind to it — the `z.function()` census matches a
`key: z.function(` spelling and a record's VALUE type is not a key, and the zod
mirror parity ledger exempts index signatures by design. A NOTE at the former
declaration site, not a gate, is what records the absence.
