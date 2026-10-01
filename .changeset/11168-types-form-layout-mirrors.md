---
'@object-ui/types': minor
---

The form layout mirrors state the two values the spec and the renderers honour. This is objectui#11168 slice 3 and delivers objectui#7759 group C.

- `ObjectFormSchema.layout`, TS and zod, is the `object-form` row's own enum, taken by reference: `vertical | horizontal`. It used to add `inline` and `grid`. `@objectstack/spec` 17.5.0 retired both, and both rendered as `vertical`. `ObjectViewSchema.form`, which picks this key, narrows with it.
- The zod `FormSchema.layout`, on the `form` node, drops `grid`. The TypeScript declaration and the `form` registration never had it, and the renderer reads only `layout === 'horizontal'`. Its `WiderThanDeclared` ledger row in the mirror-parity test resolves and is struck.
- The `columns` docs on both mirrors no longer say "for grid layout". `columns` sets the field grid's width, whatever the `layout`.

⚠️ This narrows the accept set: `layout: 'inline'` or `'grid'` is now a type error and a zod refusal. The fixed group ships the change as `minor`.
