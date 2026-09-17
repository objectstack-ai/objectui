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

**What replaces it: the per-LANE member, not a board-level toggle.** Lane
collapse is `KanbanColumn.collapsed`'s — written on the lane you want collapsed,
inside `columns` — and the board this arm renders honours it (objectui#9628, in
this same release): the lane starts collapsed and the viewer can open it again.
A board-level "may lanes collapse at all" switch is what has no replacement.
SWIMLANE collapse remains the viewer's alone: `KanbanImpl` collapses a swimlane
row when its header button is clicked and persists that set per `swimlaneField`,
and no authored key reaches it.

**Migration, in this repository: no authored document changed.** No board, no
example and no fixture authors the key. Scanned 2026-09-17 over every tracked
file — with a whitespace-tolerant probe rather than a line-anchored grep, since
the name wraps across lines in prose — every occurrence is the retirement
talking about itself, and they are these:

- the declarations retired here — `packages/types/src/objectql.ts` and its
  mirror `packages/types/src/zod/objectql.zod.ts`;
- the pins that assert the retirement —
  `object-kanban-allow-collapse-retired-8801.test.ts` and
  `bare-kanban-node-key-retired-8802.test.ts`;
- a comment in `packages/types/src/zod/complex.zod.ts`, recording that the
  deleted `retiredZeroReadKanbanKey` helper once carried this spelling on the
  SIBLING arm;
- one row of `content/docs/api/schema-reference.md`;
- the `.changeset/` release notes that discuss it — this one, the two
  historical entries covering the sibling arm's own spelling, and objectui#9629's
  note recording the correction to this paragraph.

`@object-ui/plugin-kanban` names the key in ZERO files, against live sibling
keys (`groupBy`, `conditionalFormatting`, `quickAdd`, `coverImageField`) firing
as controls on the same walk. ⛔ Their counts are deliberately not written here:
this file publishes VERBATIM into the CHANGELOG at an unknown future date, and a
figure frozen there is derived once and re-derived never. The walk is the
instrument and it re-runs on every test run — the `it` named
"`@object-ui/plugin-kanban` names it in ZERO files, with controls firing in the
same pass", in `object-kanban-allow-collapse-retired-8801.test.ts`.

The pin that moved is `bare-kanban-node-key-retired-8802.test.ts`, whose suite 3
asserted this arm still ACCEPTED the key. That stale row is gone, and it was not
replaced by a refusal row in the same place: the refusal belongs to this key's
own pin, which asserts it with the message, the `invalid_type` code and its own
firing controls, so the claim is pinned once rather than in two files. That
suite's accepting rows stay, because the claim it makes (batch #70's refusals
were arm-scoped and cannot cross an arm) is still true and this retirement is
not that claim.

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
