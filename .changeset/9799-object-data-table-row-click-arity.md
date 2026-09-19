---
'@object-ui/types': minor
---

Declare the row-click modifier payload on `ObjectDataTableSchema.onRowClick`
(objectui#9799), so the object-arm face stops denying a second argument its node
already receives.

objectui#9462 widened `DataTableSchema.onRowClick` to `(row: any, event?: any) => void`
together with the `data-table` renderer hops that had been truncating the call. Its
object-arm twin did not move with it, deliberately: that card was scope-pinned to three
hops and reported this one instead of widening it. `ObjectDataTable` forwards a host's
handler onto the very `data-table` node whose renderer objectui#9462 repaired — the
forwarding line reads
`onRowClick: schema.onRowClick ?? (recordDrillEnabled ? handleRowClick : undefined)`,
and a host's handler is the FIRST operand of that `??`, so it reaches the node whatever
the gate decides about the fallback. ⇒ the payload (`metaKey` / `ctrlKey` / `button`)
has been arriving at a published declaration that said it did not exist.

**What changed.** One member: `ObjectDataTableSchema.onRowClick` now declares
`(row: any, event?: any) => void`. ⛔ Nothing about the runtime call moved, ⛔ no other
key was narrowed, and ⛔ the `data-table` twin was not touched — this is a declaration
catching up to a call, in the widening direction only.

**Source-compatible in both directions, measured rather than assumed.** An existing
one-parameter host handler still satisfies the widened slot and the widened spelling
still satisfies the old one, so no host is refused either way. The second parameter is
optional and spelled `any`, ⛔ not `HandleClickModifiers`, for the reason objectui#9341
measured on `ObjectKanbanSchema.onCardClick`: that interface lives in `@object-ui/react`,
which depends on `@object-ui/types`, so naming it here would close a dependency cycle.
⚠️ Because both directions hold, an `extends` pin cannot separate the two trees — the
pin that does is exact identity of the parameter list, in
`object-data-table-row-click-arity-9799.test.ts`, and it is compiled by this package's
`type-check` rather than run by vitest.

**The objectui#9357 ledger moved with it, ⛔ it was not edited to agree.** That file
carried this site as a CONTROL whose stated justification was a KNOWN GAP under
measurement rather than an accurate declaration; widening the member turned the ledger
RED first, and the entry then moved from `CONTROLS` into `IN_SITES` with the forwarding
line quoted in full, gate included.
