---
'@object-ui/plugin-form': patch
'@object-ui/plugin-list': patch
'@object-ui/plugin-view': patch
'@object-ui/react': patch
---

fix(plugin-form,plugin-list,plugin-view,react): read `SchemaRendererContext` as declared, not through a cast to `any` (objectui#7209)

Five reads of the renderer context erased its type. Four cast at the read —
`useContext(SchemaRendererContext as React.Context<any>)` in the
`embeddable-form` and `object-master-detail-form` bridges, in `ListViewBlock`
and in `useResolvedDataSource` — and the `object-view` renderer's module
re-declared the imported context as a `React.Context<any>`. Through that cast a
read of a member the context does not declare compiled clean, which is how the
phantom `ctx.formValues ?? ctx.data` channel retired by objectui#7206 went
unnoticed. Each of these reads now sees `SchemaRendererContextType` as
`@object-ui/react` declares it, so such a read is a compile error on the day it
is written.

No runtime behaviour changes. Removing the casts surfaced no read of an
undeclared member; it surfaced two places where the declared `null` ("no
adapter bound") met a prop that does not admit it:

- `embeddable-form` handed that `null` to `EmbeddableForm`'s optional
  `dataSource`. It now collapses it to `undefined`, as
  `object-master-detail-form` already did; `EmbeddableForm` only ever tests the
  adapter for truthiness, so the two absences behave the same.
- `object-view` / `view` hand it to `ObjectViewProps.dataSource`, which is
  declared required and stays so (objectui#7842). That one value now carries a
  narrow, commented assertion instead of the whole context being erased; the
  value passed is the same as before.

The published signature of `useResolvedDataSource` does not move.
