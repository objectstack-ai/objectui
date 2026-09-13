---
---

Documentation and test only; nothing published moves.

`content/docs/guide/schema-rendering.md` and `packages/react/README.md` taught a `data` prop
on the `SchemaRenderer` element. `SchemaRendererProps` declares exactly one prop, `schema`,
and forwards everything else to the component the schema names, so that prop reached the
expression evaluator through nothing and failed silently. Both pages now teach
`SchemaRendererProvider` with `dataSource`, and the `data.` prefix the evaluator's scope
actually holds.

`packages/components` gains `guide-schema-rendering-data-context-8021.test.tsx`, which reads
the guide and renders it — a test file, not published source. `SchemaRendererProps` itself is
untouched, so no consumer of any tarball sees a difference.
