---
'@object-ui/sdui-parser': minor
---

html tier: name the inert `quickAdd` on `object-kanban` / `kanban` instead of calling it unknown

The Quick Add control is gated on BOTH `quickAdd` and an `onQuickAdd` handler, and
`onQuickAdd` is a runtime slot — a function — that no parsed page can write and that
`ObjectKanban` supplies none of its own for. So an authored `quickAdd: true` on either
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
