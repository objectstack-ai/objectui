---
'@object-ui/types': minor
'@object-ui/plugin-kanban': minor
'@object-ui/sdui-parser': minor
---

**BREAKING** — `quickAdd` is retired on `object-kanban` (objectui#8285, ruling B of
the director seat's decision batch #91: the board does not grow an inline
record-creation write path). This is objectui's half; `@objectstack/spec` 17.5.0
already tombstones the same key in `ComponentPropsMap['object-kanban']`.

**Why it never did anything.** The Quick Add control is gated on BOTH `quickAdd`
and an `onQuickAdd` handler. `onQuickAdd` is a host-supplied function that no JSON
document can carry, and `ObjectKanban` supplies none of its own, so an authored
`quickAdd: true` parsed green and drew nothing.

- **`@object-ui/types`** — `ObjectKanbanSchema.quickAdd` is `?: never` on the
  TypeScript face and a `retirementTombstone()` on the zod mirror: an authored
  value is refused BY NAME (`invalid_type` at `quickAdd`, carrying the remedy), not
  stripped. A tombstone rather than a deletion, because `BaseSchema` ends
  `.passthrough()` and a deleted member would be kept silently.
- **`@object-ui/plugin-kanban`** — `ObjectKanban` no longer forwards `quickAdd` to
  the board, on every `object-kanban` entry point (the registered tag, the
  `kanbanComponents` map, a host mounting `ObjectKanban`). So even a document that
  carries both halves of the pair draws no control. `KanbanRenderer` is unchanged:
  a React host that mounts it directly still passes `quickAdd` and `onQuickAdd` on
  its `schema` and gets the control.
- **`@object-ui/sdui-parser`** — the interim `inert-quick-add` warning is removed,
  with its four exports `checkKanbanQuickAdd`, `INERT_QUICK_ADD`,
  `QUICK_ADD_HOST_TYPES` and `QUICK_ADD_KEY`. It was declared interim until the
  spec refused the key by name; that has landed, and with the key retired on every
  face the tier's own `unknown-prop` warning ("has no prop quickAdd") is true and
  is the whole remedy on a constrained-JSX page, which cannot write the handler
  anyway. Severity is unchanged (warning), so no page that saves today stops saving.

**Migration.** Delete `quickAdd` from `object-kanban` nodes; it never drew a
control there. To offer Quick Add, mount `KanbanRenderer` from
`@object-ui/plugin-kanban` in a React host and pass both `quickAdd` and
`onQuickAdd` on its `schema`. Code that switched on the `inert-quick-add`
diagnostic code, or imported one of the four removed names, drops that branch:
the key now draws `unknown-prop` like any other prop the block does not have.

`ObjectKanbanSchema.onQuickAdd` is retired on `object-kanban` too, by objectui#11234
in the same release: on that element it was never called, because its partner is
gone. The Quick Add pair on `KanbanRenderer` is unchanged.
