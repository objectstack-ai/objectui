---
'@object-ui/sdui-parser': minor
---

html tier: name the inert `quickAdd` on `object-kanban` / `kanban` instead of calling it unknown

The Quick Add control is gated on BOTH `quickAdd` and an `onQuickAdd` handler, and
`onQuickAdd` takes a function, which no parsed page can write and which `ObjectKanban`
supplies none of its own for. objectui#11234 retires `onQuickAdd` on `object-kanban` in the
same release; it remains a host-supplied prop on `KanbanRenderer`'s `schema`. So an authored
`quickAdd: true` on either
`ObjectKanbanRenderer` tag has never produced a control.

Until now the only thing the tier said about it was `unknown-prop`, "has no prop
quickAdd" — false against `@objectstack/spec`, which publishes the key, and
indistinguishable from a typo. It now draws an `inert-quick-add` **warning** that names
the missing half of the pair and points at `kanban-ui`, where a React host can supply
the function. Severity is unchanged (warning, as `unknown-prop` was), so no page that
saves today stops saving.

New exports: `checkKanbanQuickAdd`, `INERT_QUICK_ADD`, `QUICK_ADD_HOST_TYPES`,
`QUICK_ADD_KEY`.

Interim by ruling (objectui#8285, decision batch #91): the contract-side refusal is
retiring `object-kanban.quickAdd` from the spec's `ComponentPropsMap`, and this
diagnostic is removed by the change that lands it. `kanban-ui` keeps the
`quickAdd` / `onQuickAdd` pair untouched.

⚠️ **Dated note, 2026-09-29 — the contract moved in this same release — objectui#11073.**
The reason given above, that "has no prop quickAdd" was false because `@objectstack/spec` publishes the key, no longer holds. Later in this release this repository began resolving `@objectstack/spec` 17.5.0, which carries the retirement this diagnostic was declared interim for: `object-kanban.quickAdd` is now a spec tombstone, refused by name at the authoring door. The diagnostic's own removal belongs to the change that ruled it and is not made here. Until then, the key it names is one the contract itself refuses.
