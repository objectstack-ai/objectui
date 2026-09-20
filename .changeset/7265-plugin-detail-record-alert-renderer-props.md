---
---

Internal, type-only: `@object-ui/plugin-detail`'s `record:alert` renderer renames
its module-local props interface from `RecordAlertProps` to
`RecordAlertRendererProps`, the spelling every other renderer in that directory
already uses. `@objectstack/spec/ui` exports `RecordAlertProps` for the block's
AUTHORED properties — the bag this interface nests under `schema.properties` —
so the two names described different concepts, which is what
`pnpm check:spec-symbols` had been flagging. Nothing is published: the interface
was never exported, the renderer's own name and runtime behaviour are unchanged,
and the declaration's member list is byte-for-byte what it was.

This is the last entry in that gate's rule-1 `DEBT` ledger (objectui#7265). The
same change rewords the gate's stale-entry message so it no longer spells a
GitHub closing keyword in front of the ledger anchor's own number — that message
is quoted into pull-request bodies by design on this card, and the keyword put a
card-ending trigger in the merge path of every slice that quoted its own reading.
