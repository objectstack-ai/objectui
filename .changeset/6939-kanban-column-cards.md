---
'@object-ui/types': minor
---

Rename `KanbanColumn.items` to `cards`, in both halves of the published surface
(objectui#6939, maintainer ruling 2026-09-02).

**Breaking, deliberately.** `KanbanColumn` declared its card list as `items` in
`complex.ts` and in the zod mirror `complex.zod.ts`. Every board reads `cards`.
Measured on `origin/main` `78a3cc238`: `KanbanImpl.tsx` reads `.cards` on 12
lines, `KanbanEnhanced.tsx` on 8, and `bucketCardsIntoColumns` twice more as
`col.cards || []`; `.items` had **zero** read sites in either board (a
same-shaped `.title` control on the same two files returns 8 and 3, so those
zeros are readings and not a mis-shaped probe). Both catalog entries, the
plugin docs and `content/docs/api/schema-reference.md` all author `cards`.

The consequence was `declared !== enforced` on a published mirror: every
authored kanban document failed `safeValidateSchema` with `: Invalid input`
while rendering perfectly, which is how the type sat in objectui#6318's
"carries a registered component type but did not validate" bucket.

**Why the rename went this way and not the other.** Renaming the twelve read
sites to `items` was considered and rejected: `bucketCardsIntoColumns` reads
`col.cards || []`, so the `items` spelling buckets every column to zero cards.
Measured through the render harness in
`examples/schema-catalog/test/kanban-column-cards-6939.test.tsx` on `78a3cc238`,
the `basic-kanban-board` entry goes from 64 elements reading `To Do2 … Design
new feature …` to 45 elements reading `No cards3 columnsTo Do0 …` — an empty
board. The declaration, not the corpus, was the wrong side.

⚠️ The second of those two readings has since moved by one node, and this
paragraph is anchored rather than rewritten because the finding it supports is
unchanged: objectui#9170 removed the lane count from the board-level empty
state, so the same entry now measures 44 elements and reads `No cardsTo Do0 …`.
The `items` spelling still empties the board, which is the whole of the argument
above. The harness keeps both readings side by side and asserts the subtraction
between them.

**Migration.** If you author `KanbanColumn` objects against `@object-ui/types`
or validate them through `@object-ui/types/zod`, rename `items` to `cards`.
Documents that already author `cards` — which is every document in this
repository, and what the boards have always rendered — need no change and now
validate. Documents authoring `items` are refused rather than silently drawn as
an empty board.

`@object-ui/plugin-kanban` is unchanged; it already declared `cards`.
