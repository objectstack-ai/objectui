---
'@object-ui/plugin-kanban': minor
'@object-ui/types': minor
---

Honour `columns[].collapsed` on the registered kanban board (objectui#9628).

The key was declared on **both** published faces of the `object-kanban` arm — the lane
element of `ObjectKanbanSchema` (`objectql.ts` and its Zod mirror) and the runtime lane
`KanbanColumn` (`complex.ts` and its mirror) — and read by `KanbanEnhanced` alone, a
module no production source imports. An authored `{ "id": "todo", "title": "To Do",
"collapsed": true }` therefore parsed green on both faces and reached a board that did
nothing with it: `KanbanImpl`'s only collapse is the SWIMLANE row's, held in viewer
state under `objectui:kanban-collapsed:<swimlaneField>` and never keyed to a lane's
declared value. That is the ADR-0049 declared-but-unhonoured shape.

**The repair is at the reader, not at the declaration.** Retiring the key would narrow a
published accept set, and it would also strand objectui#8801's retirement tombstone,
which names `KanbanColumn.collapsed` as where lane collapse lives. Honouring it moves no
accept set in either direction: both faces already declare the member, and
`@objectstack/spec` declares the lane element as `z.unknown()`, so the protocol neither
names the key nor refuses it. Nothing that parsed before parses differently now.

**What an authored `collapsed: true` does.** The lane renders narrowed to a title spine
with its cards withheld, on **both** of the board's layouts — the flat lane and the
column cells of each swimlane row — and its heading becomes a disclosure the viewer can
open. That is the meaning `KanbanEnhanced` already gave the key, so the platform states
one behaviour for it rather than two.

The authored value is the lane's **initial** state. A viewer's own toggle wins after
that and survives the data refreshes that rebuild the lane objects: the board holds the
viewer's overrides and resolves them against the current prop, rather than copying the
authored flags into state where every refetch would re-collapse a lane the viewer had
opened. A lane whose cards could never be reached again — and whose drop target was
blind — would have been a worse board than the one that ignored the key.

**No change to a board that does not author the key.** The disclosure appears only on a
lane that declared `collapsed: true`, so an omitted key and an authored `collapsed:
false` are indistinguishable, and a board authoring neither renders the DOM it rendered
before. The published `describe` text and docblocks on both faces, the plugin README and
the plugin docs page stop pointing authors at the unregistered board.
