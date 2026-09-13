---
'@object-ui/types': minor
---

`ObjectKanbanSchema` now judges two of the three handler keys the kanban board reads off the
authored document (objectui#7804, the `plugin-kanban` slice; director seat ruling of
2026-09-07, decision batch #69): `onCardClick` and `onQuickAdd` are declared as objectui#6124
RUNTIME SLOTS — callable on the TypeScript face, refused BY NAME in the zod mirror because
JSON has no function value — and the message points at the node-type spelling an author can
write instead.

Until now neither was declared anywhere. `BaseSchema` is `.passthrough()`, so a key no arm
declares is not refused: it stops being judged and the value is KEPT, then reaches the
renderer that reads it. Measured on this branch, `{ "type": "object-kanban", "objectName":
"task", "groupBy": "status", "onCardClick": { "action": "toast" } }` parsed GREEN with
`{"action":"toast"}` surviving into the parsed output, and `KanbanRenderer` forwarded it to a
call site expecting a function. That is objectui#7664's measured transition, inherited by
this face when objectui#8802 retired the sibling `kanban` arm that used to carry all three as
runtime slots.

**Accept-set change on the published zod mirror — breaking, shipped as `minor` per this
repo's version-alignment policy (majors track `@objectstack`).** A declared key is validated
even under `.passthrough()`, so two documents that parsed green yesterday are refused today,
each at its own path: `onCardClick` and `onQuickAdd` carried at all. Neither is authorable
in JSON by construction (a function has no JSON value), and `@objectstack/spec`'s
`ObjectKanbanPropsSchema` — fourteen keys on the installed 17.4.0 pin — already refuses both
by `unrecognized_keys`, so this narrows toward the protocol rather than away from it. Every
other key parses exactly as before, and an undeclared key still passes through unchanged.

**No renderer change; no runtime behaviour changes.** The registration, its `inputs` and
`ObjectKanban` are untouched. On the TypeScript face both keys become typed members where
`BaseSchema`'s index signature used to absorb them, so a wrong-typed value is now a compile
error at the key.

**The third key, `onCardMove`, is deliberately NOT declared, and that is a measurement rather
than an omission.** Its authored value reaches nothing on this face — `ObjectKanban`
substitutes its own mover on the schema it hands down and declares no `onCardMove` React
prop — which is the objectui#6124 `'retired'` disposition; `check:handler-key-reads` refuses
that spelling while `KanbanRenderer` still reads the key, printing `declares it RETIRED, but
a renderer still reads it`. The two spellings that would make the gate green are both worse:
`'runtime-slot'` would publish a callable key the object-bound board drops, and deleting the
read would narrow `KanbanRenderer`'s published props — a ruling, not a repair. The key keeps
its `KNOWN_UNDECLARED_READS` row naming objectui#7804, which stays open and stays the parent.
