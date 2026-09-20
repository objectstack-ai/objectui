---
'@object-ui/types': minor
---

Declare `columns` on the `object-kanban` face — the swimlane vocabulary the board
reads and neither published face named (objectui#8913).

**`minor`, and the level is reasoned rather than copied.** This is not a `patch`:
`@object-ui/types/zod` is a published validator and its **accept set narrows**. A
document whose `columns` was previously admitted unexamined — `columns: "todo"`,
`columns: [42]`, a lane with no `title`, a numeric lane `id`, a mix of the two
array shapes, a lane card with no `title` — is now refused by
`ObjectKanbanSchema.safeParse` and by `safeValidateSchema`, so a consumer's own
validation can go from green to red on bytes they did not change.
It is not a `major` either: this repository's fixed group tracks the
`@objectstack` major (AGENTS.md §版本号策略), so breaking semantics ship as
`minor` with the semantics spelled out — which is what this entry is.

**What moved.** `ObjectKanbanSchema` gains `columns` on both halves that move
together — the TypeScript interface (`objectql.ts`) and its Zod mirror
(`zod/objectql.zod.ts`). Retiring the bare `kanban` node type key (objectui#8802)
removed the only face that judged a lane, and `object-kanban` had never declared
the key, so it rode `BaseSchema`'s `[key: string]: any` / `.passthrough()`:
read by the renderer at three sites, named by no published face.

**Declaring here can only narrow.** On a face that already carries an index
signature there is no wider state to reach — the value was already `any` — so this
adds validation where there was none and mints no new authoring surface.

**The shape is the protocol's, not this repository's runtime lane type.**
`@objectstack/spec` declares `ObjectKanbanPropsSchema.columns` as
`z.array(z.unknown()).optional()` and states the shape in its `describe` prose:
swimlane definitions, `{ id, title }` per `groupBy` value, **or bare value
strings**. Both arms are admitted whole — `columns` is `string[] | Lane[]`, a
union of two ARRAY shapes rather than an array of a per-element union — and on the
lane arm **`cards` is optional**. The alternative — reusing `KanbanColumn`, whose
`cards` is required — was measured and rejected: it is the RUNTIME lane
(`bucketCardsIntoColumns` fills `cards` before either board implementation sees
one), and as the authoring element it would have refused the protocol's own
gate-validated `{ id, title }` example, the lanes the renderer materializes from a
picklist, and this repository's own typed board fixtures.

**What is judged again.** A lane has `id` (**string**) and `title`, optionally
carrying `cards`, `limit`, `className` and `collapsed` — exactly the members the
two board implementations read. When a lane carries `cards`, each card is judged
by the one card authority (`KanbanCardSchema`), which is what restores
objectui#6939's finding: **a card with no `title` is refused again**.

**Two shapes the protocol's literal `z.unknown()` would take are refused, because
the renderer mishandles them.** A declaration that admits a shape nothing can
render is the same defect one layer up, so neither is blessed:

- a **numeric lane id**. `bucketCardsIntoColumns` builds its `knownIds` set from
  the raw `col.id` and compares it with `Object.keys(groups)`, which are strings,
  so a numeric id injects each record into its lane **and** sweeps it into
  "Uncategorized" — measured `1:r1, 2:r2, __uncolumned__:r1+r2` against a clean
  `one:r1` string control. The renderer defect is objectui#8993; `KanbanColumn.id`
  and its mirror are `string` and the protocol names no type, so refusing it here
  is not a narrowing below the protocol.
- a **mixed array**. The renderer dispatches on `columns[0]` alone, so an
  object-first mix pushes strings through the object branch (a blank lane, cards
  in "Uncategorized") and a string-first mix is ignored whole. The protocol's "or"
  names two array shapes and no mixed example.

**The bare-string array is admitted for parity, and on this block it is now
REACHABLE.** The renderer honours it only when a board has no `groupBy` — the
`effectiveColumns` memo takes the string branch under `if (!schema.groupBy)` — and
`groupBy` was required on this face when this entry was written, so no document
that passed this schema could reach it. objectui#8990 has since made `groupBy`
optional on both twins (`groupBy?: string` in `objectql.ts`,
`z.string().optional()` in the Zod mirror), and a lane-less board now does reach
the arm: a board carrying only `objectName` and `columns: ['todo', 'doing', 'done']`
parses green and satisfies every guard on that branch, drawing those lanes titled
by the raw strings. It is declared because refusing an arm the protocol names would
be a second narrowing — that reason is unchanged; what moved is that the arm is
exercised rather than dormant. objectui#8990's own entry records the same
reachability from its side, pinned with a firing control in
`packages/plugin-kanban/src/__tests__/laneLessBoard-8990.test.tsx`.

**What is deliberately NOT judged.** `cards` is not required (a swimlane does not
carry its own cards), so an undeclared lane key such as the retired `items`
spelling is accepted and dropped rather than refused — the strip posture
`KanbanColumn`'s own mirror already carries, and the tolerant face's posture
rather than the strict twin's, which refuses it by name. Narrowing below the
protocol's two arms is an `@objectstack/spec` change, not a local one.

**Migration.** Boards authored the way the docs and the schema catalog teach them
need no change. A board whose `columns` carried a shape nothing could render —
a non-array, a non-lane element, a lane missing `id`/`title`, a numeric lane `id`,
a mix of the two array shapes, or a card missing `id`/`title` — now reports
instead of validating silently and rendering an empty, duplicated or mis-bucketed
lane.
