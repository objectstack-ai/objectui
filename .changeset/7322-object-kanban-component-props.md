---
'@object-ui/plugin-kanban': minor
---

⏱ **Dated reading — every measurement below was taken on 2026-09-06 (`6ca6e12a7`),
and five later cards have since falsified parts of it. It is kept as a dated reading
rather than silently overwritten: it was TRUE when written, and overwriting that is
a false record of its own (objectui#9713).**

| reading below | falsified by | landed |
| --- | --- | --- |
| the component is registered under TWO node type keys, and `KanbanSchema` is one of the two declared node types | objectui#8802 — the bare `kanban` key and its `KanbanSchema` arm retired, and the prop narrowed back to the single `ObjectKanbanSchema` arm, which is exactly the narrowing the note below made conditional on a registration being removed first | 2026-09-10 |
| `ObjectKanbanSchema` declares `objectName` REQUIRED | objectui#7780 (PR objectui#8412) — a record-source presence rule; `objectName` is optional | 2026-09-07 |
| `ObjectKanbanSchema` declares `groupBy` REQUIRED | objectui#8990 (PR objectui#9021) — optional, as the protocol declares it | 2026-09-10 |
| `filter` is declared by NEITHER face | objectui#8174 (PR objectui#8788) — declared on `ObjectKanbanSchema` | 2026-09-09 |
| `columns` and `cardTitle` are `KanbanSchema`-only | objectui#8913 (PR objectui#8989) and objectui#9606 (PR objectui#9709) — both are now declared on `ObjectKanbanSchema` | 2026-09-10, 2026-09-17 |

⇒ All five **ROTTED**; none was born false. Each was measured true on 2026-09-06 and
falsified afterwards by a card that had no reason to read this file. ⛔ Every reading
below therefore carries the date it was taken, and none is restated in the undated
present tense — that tense is the construction that rotted, and a re-measurement
written in it would only rot again before this entry publishes.

`ObjectKanbanComponentProps.schema` names both node types the component is registered for
(objectui#7322 item ②, following the objectui#5903 / #5018 land shape).

`ObjectKanbanRenderer` is registered under two keys — `'object-kanban'` and `'kanban'` —
and the two keys have different declared node types: `ObjectKanbanSchema` (`type:
'object-kanban'`, `objectName` and `groupBy` required) and `KanbanSchema` (`type:
'kanban'`, both optional). The prop named `KanbanSchema` alone, so **no `object-kanban`
node was assignable to the component that renders it**, and the discriminants are disjoint
string literals, so no cast-free annotation existed for half the boards this component
serves. It is now the union of the two — **as of 2026-09-06**; objectui#8802 then
retired the second arm and the prop narrowed back to one, which is the dated-reading
block above.

## What settled it: the read set

`ObjectKanban` reads more keys off `schema` than either declaration covered on its own —
that read set is the bullet list below, and each arm is load-bearing:

- `objectName`, `groupBy`, `limit`, `cardFields` — declared on both;
- `columns`, `cardTitle`, `swimlaneField`, `grouping` — `KanbanSchema` only **as of
  2026-09-06**. `columns` (objectui#8913) and `cardTitle` (objectui#9606) have since been
  declared on `ObjectKanbanSchema`, and `KanbanSchema` itself retired (objectui#8802), so
  of these four only `swimlaneField` and `grouping` were still declared by no face when
  that was re-read on 2026-09-17;
- `titleField` — `ObjectKanbanSchema` only (which is why that read was spelled
  `(schema as any).titleField`);
- `data`, `bind`, `className` — `BaseSchema`;
- `filter` — declared by **neither** face **as of 2026-09-06**, still riding
  `BaseSchema`'s index signature then; objectui#8174 (PR objectui#8788) declared it on
  `ObjectKanbanSchema` on 2026-09-09. Measured and reported, **not** changed here: this
  card moves the prop, not the two published schema faces.

⏱ **Two cardinals removed on 2026-09-17 (objectui#9726), ⛔ not replaced with newer
ones.** This paragraph read 「reads thirteen keys off `schema`」 and 「the two TOGETHER cover
twelve」. Re-measured BY BINDING — property reads off the component's own `schema` prop, with
`resolveKanbanTitleField`'s same-named parameter excluded by region — the read set is **14**
today and was **14** at this entry's own measurement commit `6ca6e12a7`, because the bullets
above omit `navigation`, which this entry's own 「Casts this removes」 section names as a read
(`(schema as any).navigation` then, `schema.navigation` now). ⇒ 「thirteen」 was one short when
it was written — **born false**, ⛔ not rotted afterwards, which is why it gets no row in
the dated table above: that table records readings something LATER falsified, and nothing
falsified this one, it arrived wrong. ⛔ The table's 「none was born false」 is a statement
about those five rows, not about this cardinal. It is not restated as 14: a cardinal in an
entry that publishes verbatim is derived once and then never again, and the bullets above
already ARE the set. Which face declares each of them is `ObjectKanbanSchema`'s answer, and
`tsc` already reads it.

So naming `ObjectKanbanSchema` alone — the remedy the original card implied — would have
been wrong in the other direction: it drops four declared reads and the `'kanban'`
registration.

## Not affected

Widening a member of an exported prop type is additive: every caller that passed a
`KanbanSchema` still compiles, and the union claims exactly the accept set the registry
dispatches to this component — a third node type is still turned away. The runtime is
untouched; `ObjectKanbanRenderer` still takes `schema: any`, so no shape is turned away
there either (the objectui#5903 disposition, restated). The view-level `kanban.groupField`
alias, `BaseSchema`'s index signature, and `@object-ui/types` are all untouched.

## Casts this removes

Inside `ObjectKanban.tsx`, three schema-key reads drop their `as any`: `titleField` (two
sites, now honest because the `object-kanban` arm declares it) and `cardFields` /
`cardTitle` (already declared; the casts were redundant). `(schema as any).navigation`
**stays** — `navigation` is declared on neither face, so removing the cast would change
nothing but the spelling of an index-signature read.

Four of the six in-package fixtures that mount an `object-kanban` board drop their
`as never` escape for a real `satisfies ObjectKanbanSchema`. The other two are static
boards (`columns` + inline `data`, no fetch) that author no `objectName`, which
`ObjectKanbanSchema` declared required **as of 2026-09-06** — objectui#7780's subject,
and that card made it a record-source presence rule on 2026-09-07; their casts stay,
now carrying the reason and the card number.
