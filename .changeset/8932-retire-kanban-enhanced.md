---
'@object-ui/plugin-kanban': patch
---

Delete `packages/plugin-kanban/src/KanbanEnhanced.tsx` (objectui#8932, ruling of
2026-09-11, ratified by the maintainer 2026-09-24).

**What leaves the published package:** `dist/KanbanEnhanced.d.ts` and
`dist/KanbanEnhanced.d.ts.map`, the typings emitted for that module. They were
the only part of it this package ever shipped. The `KanbanEnhanced` component
itself was never in `dist/index.js` or `dist/index.umd.cjs`, because nothing the
entry point imports reached it.

**No supported import changes.** This package's `exports` map has exactly two
entries, `.` and `./style.css`, and the entry point never re-exported
`KanbanEnhanced`, so `@object-ui/plugin-kanban/KanbanEnhanced` was never a
resolvable specifier. Its registry key, `kanban-enhanced`, retired earlier in
this release (objectui#8257). After that, only two test files referred to the
module.

**If you deep-imported it** through a path into
`node_modules/@object-ui/plugin-kanban/dist/` that the `exports` map never
allowed, that path only ever reached typings with no JavaScript behind them, and
now it reaches nothing. Render the one registered board, `object-kanban`, instead.
`KanbanCard` and `KanbanColumn`, which the module re-exported, are still
exported from `@object-ui/plugin-kanban`. The card-formatting rule type it
aliased is `KanbanConditionalFormattingRule` in `@object-ui/types`.
`KanbanEnhancedProps` is gone along with the component.
