---
---

Skill prose only, no package released: in `skills/objectui/rules/protocol.md`, the grid `2xl`
paragraph tagged `BreakpointColumnMap` in `@object-ui/layout` with the parenthetical
`responsive-grid`. That was the node type key PR objectui#11460 retired under objectui#11441
(ruling B), together with its `layout:` twin: `packages/layout/src/index.ts` registers only
`page:card` and `app-schema-renderer`, so a node authored from the parenthetical renders the
"Unknown component type" panel and `objectui validate` refuses it at `type`. The parenthetical
now names what still exists, the type of the `ResponsiveGrid` React component's `columns` prop,
which is what `ResponsiveGrid.tsx` says of the map. The rest of the sentence and of the paragraph
(the six keys, `grid` reading all six, the measured class ramps, the pre-objectui#7097 note) is
unchanged, and so is `skills/objectui/evals/protocol.json`, which never quotes this sentence
(objectui#11471).
