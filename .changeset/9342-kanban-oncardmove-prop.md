---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
'@object-ui/components': minor
---

**BREAKING (scored `minor` per this repo's version-alignment convention)** —
`KanbanRenderer` takes `onCardMove` as an explicit React prop, and the
`object-kanban` document face tombstones the key (objectui#9342, executing the
`domain:ui` seat's option-B ruling on PR objectui#9338; the objectui#7742 remedy
`objectFields` took one member over, maintainer decision batch #70).

A `major` is unavailable by convention, not by preference: every package in
`.changeset/config.json`'s `fixed` group ships as one family whose major tracks
`@objectstack`, so `scripts/check-changeset-no-major.mjs` rejects a `major`
declaration outright. Breaking semantics are stated here instead.

## `@object-ui/plugin-kanban` — the move, and what it breaks

`onCardMove` is now a **React prop on `KanbanRendererProps`**, a sibling of
`schema`, and is **no longer a member of the `schema` bag**. `ObjectKanban`
passes its own `handleCardMove` through that prop.

⚠️ **This narrows a published props surface.** A host that renders
`KanbanRenderer` directly and wrote the handler inside `schema` must move it to
the prop: `schema={board} onCardMove={handler}`. A typed host gets a TS error; an
untyped one gets a silent drop, which is why the change carries
`needs:contract-review`.

## `@object-ui/types` — the key is refused by name, as a TOMBSTONE

`ObjectKanbanSchema.onCardMove` is `?: never` on the TypeScript face and
`handlerKeyRefusal('onCardMove', 'retired', …)` on the `@object-ui/types/zod`
mirror. An authored `onCardMove` was **accepted and silently dropped** before
this: `BaseSchema` is `.passthrough()`, so an undeclared key is not refused — it
stops being judged and the value is KEPT — and `ObjectKanban` then substituted
its own mover over it.

⛔ **RETIRED, not a RUNTIME SLOT**, and the two are not interchangeable here. A
slot keeps the TypeScript twin callable, which would publish a key the
object-bound board DROPS — the resolution this package's `quickAdd` carve-out
forbids in as many words. The sibling `onCardClick` is a slot because its
function reaches the board through a React prop `ObjectKanban` declares;
`onCardMove` has no such prop, and objectui#7804 measured that by driving the
handler the board was actually handed, with `onCardClick` as the lit control on
the same document and the same render.

⭐ **Why it took a second card.** The disposition did not move — objectui#7804
already measured `'retired'`. What blocked it was `check:handler-key-reads`,
which refuses a tombstone while a renderer still reads the key off the document
("a tombstone exists precisely because nothing reads the key — it has no read
site BY CONSTRUCTION"). What that gate cannot see is that the value at the read
was substituted one hop earlier. Moving the READ is what makes both sides true
at once, and it drains the key's `KNOWN_UNDECLARED_READS` row.

## `@object-ui/components` — the doc this makes wrong

`src/renderers/complex/README-KANBAN.md` taught an `object-kanban` document
carrying `"onCardMove": "(event) => …"` — a function spelled as a string,
accepted and silently dropped on the day it was written and refused by name from
now on. It teaches the React prop instead, and its prop table spells the key
`never`.
