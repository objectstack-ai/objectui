---
'@object-ui/types': minor
---

**BREAKING** — `ObjectKanbanSchema` no longer accepts `allowCollapse`, on either
published face (objectui#8801).

**FROM** `allowCollapse?: boolean` **TO** *nothing* — the key is retired, and
there is no replacement key. Delete it.

```ts
// before
const board: ObjectKanbanSchema = { type: 'object-kanban', objectName: 'task', groupBy: 'status', allowCollapse: true };
// after
const board: ObjectKanbanSchema = { type: 'object-kanban', objectName: 'task', groupBy: 'status' };
```

**Disposition: an ADR-0087 D2 tombstone, not a deletion.** The member stays
declared and unwritable — `?: never` on the interface, `retirementTombstone()`
on the zod mirror — so an author gets `invalid_type` at `allowCollapse`
carrying the prescription, not a bare `unrecognized_keys` and not silence.
A plain removal would have been the silent option: `BaseSchema` carries
`[key: string]: any` and its mirror ends `.passthrough()`, so a dropped member
is KEPT rather than refused, which trades one no-op for another.

**Nothing that worked stops working.** `@objectstack/spec` has never declared
the key — `ComponentPropsMap['object-kanban']` (`ObjectKanbanPropsSchema`) is a
`strictObject` whose member list does not name it, and the token occurs nowhere
in that package's published sources. So the platform was already refusing an
authored `allowCollapse` by name at publish while this face said yes: `tsc`
agreed and the document was rejected whole. This change is what makes `tsc` say
so too. No registered board ever read the key, and the capability it appeared to
offer is reached another way — see "What replaces it" below.

Re-measured on this branch against the BUILT artifact — the `dist` bytes a
consumer installs, not `src` — with controls in the same pass so the instrument
is not blind:

```
{ allowCollapse: true } | { allowCollapse: false } | { allowCollapse: 'yes' }
                                                    RED  invalid_type at `allowCollapse`
{ groupField: 'status' }                            RED  invalid_type at `groupField`    <- OTHER TOMBSTONE
{ quickAdd: true } · { coverImageField: 'cover' } · { limit: 50 }
                                                    GREEN                                <- LIVE CONTROLS
{ allowCollapsing: true }                           GREEN                                <- NEAR-MISS CONTROL
```

Live members parse green, so the arm is not refusing everything. A never-declared
near miss of the same spelling parses GREEN rather than red — this arm is not
strict, which is precisely why the tombstone rather than a deletion is what does
the refusing here.

**What replaces it: nothing you author.** Lane collapse is
`KanbanColumn.collapsed`'s — a per-lane member — not a board-level authored
toggle. On the board this arm actually renders it is the VIEWER's rather than
the author's: `KanbanImpl` collapses a swimlane when its header button is
clicked and persists that set per `swimlaneField`. The implementation that does
honour a lane's own `collapsed`, `KanbanEnhanced`, is referenced by no
registration since the `kanban-enhanced` node key retired (objectui#8257).

**Migration, in this repository: no authored document changed.** Over every
tracked file, the only occurrences of the name were the two declarations retired
here, one pin, one docs row and two historical changesets — no board, no
example, no fixture authors it, and `@object-ui/plugin-kanban` names it in ZERO
files against firing controls in the same pass (`groupBy` 45 files,
`conditionalFormatting` 8, `quickAdd` 6, `coverImageField` 3). The pin that
moved is `bare-kanban-node-key-retired-8802.test.ts`, whose suite 3 asserted
this arm still ACCEPTED the key; that row is now a refusal assertion, at its
site, with the reason stated — its three sibling rows stay accepting, because
the claim that suite makes (batch #70's refusals were arm-scoped and cannot
cross an arm) is still true and this retirement is not that claim.

⚠️ This repository's census cannot see a TypeScript consumer outside it that
wrote the key. Such a consumer gets a compile error naming the member, which is
why the FROM/TO is spelled out above — and its documents were already being
refused at publish by the protocol.

⚠️ The same spelling on the sibling `kanban` arm is a DIFFERENT key on a
different face and is not what moved here. Batch #70 (objectui#7742) tombstoned
it on `KanbanSchema`, and objectui#8802 then removed that arm whole; those
refusals were arm-scoped by construction, so an `object-kanban` document went on
being accepted for as long as this declaration stood. Two arms of one renderer
now say the same thing.
