---
'@object-ui/types': minor
'@object-ui/plugin-kanban': patch
---

**BREAKING (scored `minor` per this repo's version-alignment convention)** —
`ObjectKanbanSchema.onQuickAdd` is retired on `object-kanban` (objectui#11234).
This completes ruling B of the director seat's decision batch #91
(objectui#8285): the object-bound board does not grow an inline record-creation
write path, and the Quick Add pair stays with a React host.

**Why it did nothing.** After objectui#8285 retired `quickAdd`, `onQuickAdd`
stayed a runtime slot. A host-supplied function reached the board by identity,
and on `object-kanban` it was never called, because the Quick Add control is
gated on both halves of the pair. A TypeScript host or an AI that wrote the key
compiled and got nothing.

- **`@object-ui/types`** — `ObjectKanbanSchema.onQuickAdd` is `?: never` on the
  TypeScript face, and `handlerKeyRefusal('onQuickAdd', 'retired', …)` on the
  zod mirror. An authored value is refused BY NAME (`custom` at `onQuickAdd`,
  the same code as before), and the message now says RETIRED instead of RUNTIME
  SLOT. This narrows a published TypeScript face: a typed host that wrote the
  key on an `object-kanban` node now gets a type error.
- **`@object-ui/plugin-kanban`** — `ObjectKanban` renders an internal board
  that takes the Quick Add pair only as explicit props, and it supplies neither
  half. The internal board is not exported. `check:handler-key-reads` refuses a
  tombstone while a renderer on the registration still reads the key off the
  document, and this change removes that read from the `object-kanban` path.
  `KanbanRenderer` is unchanged for a host: it reads `schema.quickAdd` and
  `schema.onQuickAdd` exactly as before, and the control draws and calls the
  host's function.

**Migration.** Delete `onQuickAdd` from `object-kanban` nodes and from any
`ObjectKanbanSchema` object a host builds. It was never called there. To offer
Quick Add, mount `KanbanRenderer` from `@object-ui/plugin-kanban` in a React
host and pass both `quickAdd` and `onQuickAdd` on its `schema`.

The objectui#8285 entry's closing note, which said `onQuickAdd` stayed a runtime
slot on `object-kanban`, is amended in this change to match.
