---
'@object-ui/plugin-kanban': patch
---

Delete `packages/plugin-kanban/src/KanbanEnhanced.tsx` (objectui#8932, ruling of
2026-09-11, ratified by the maintainer 2026-09-24).

**How the component left the bundle.** Through 17.6.0 the `KanbanEnhanced`
component shipped inlined in `dist/index.js` and `dist/index.umd.cjs`, reachable
through the `kanban-enhanced` registry key and the `kanbanComponents` map. It
leaves the bundle in this release together with that key (objectui#8257 /
objectui#8802, the kanban and gantt family retirement entry). After that
retirement, only two test files still referred to the source file.

**What this change removes:**

- the source file;
- `dist/KanbanEnhanced.d.ts` and `dist/KanbanEnhanced.d.ts.map`, the typings the
  build still emitted for it;
- the `@tanstack/react-virtual` dependency, whose only consumer in this package
  was that file.

**No supported import changes.** Neither the 17.6.0 `exports` map (`.` only) nor
this release's (`.` and `./style.css`) has a `./KanbanEnhanced` entry. Neither
entry point exports the component by name. `@object-ui/plugin-kanban/KanbanEnhanced`
is not a resolvable specifier.

**If you deep-imported it** through a path into
`node_modules/@object-ui/plugin-kanban/dist/` that the `exports` map does not
allow, that path reached `dist/KanbanEnhanced.d.ts` in 17.6.0. Those typings had
no `dist/KanbanEnhanced.js` beside them, and now the path reaches nothing. Render
the one registered board, `object-kanban`, instead. `KanbanCard` and
`KanbanColumn`, which the module re-exported, are still exported from
`@object-ui/plugin-kanban`. The card-formatting rule type it aliased is
`KanbanConditionalFormattingRule` in `@object-ui/types`. `KanbanEnhancedProps` is
gone along with the component.

**If you import `@tanstack/react-virtual` yourself** and got it only through
`@object-ui/plugin-kanban`, declare it in your own `package.json`.

**`style.css`.** This package's stylesheet, `@object-ui/plugin-kanban/style.css`,
first ships in this release (objectui#4929). It is built after this deletion, so
it does not carry the three utility rules only that module used:
`border-border/50`, `text-yellow-500` and `shadow-xl`.
