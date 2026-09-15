---
'@object-ui/react': minor
'@object-ui/components': minor
---

`toRenderableSchema` is behaviour-preserving for the falsy primitives too, so `empty`
stops printing a stray `"0"` (objectui#8908).

`toRenderableSchema` is the repo's permanent bridge from `@object-ui/types`' `SchemaNode`
union onto `SchemaRendererProps['schema']`, which deliberately declares no `number` /
`boolean` (objectui#4548 ruling Q2). Its docblock promised — and its callers were entitled
to rely on — that "the value a caller forwards renders identically whether or not it
passes through here". That was false for exactly two of the six `SchemaNode` members.

The bridge mapped every `number` / `boolean` onto `String(node)`. `String(0)` and
`String(false)` are the NON-EMPTY strings `'0'` and `'false'`, which are truthy, so they
sailed past `SchemaRenderer`'s own `!evaluatedSchema` leg and rendered as their own text —
while the same two values handed to `SchemaRenderer` directly render nothing, pinned since
objectui#4548. The mapping is now two-legged and mirrors the renderer's own narrowing
order: a truthy `number` / `boolean` still becomes its text form, and a falsy one
(`0`, `-0`, `NaN`, `false`) becomes nothing.

**Behaviour change on a published surface, deliberately.** The reachable, shipped instance
is `empty`: its `action` slot gates on nullish rather than truthiness (objectui#7105, so a
bare string node renders instead of being dropped), so `0` and `false` went through the
bridge. `{ type: 'empty', title: 'T', action: 0 }` rendered `"T0"` and now renders `"T"`,
which is what the same node handed straight to `SchemaRenderer` has always rendered.
Every other slot routed through the bridge — page regions, header-bar actions, detail tabs
and footers, report sections, view configs — gets the same correction for the same two
values.

**No type change, and that is not an accident.** The return type is unchanged:
`BaseSchema | string | null | undefined`. Letting `0` / `false` through UNCHANGED would
have widened it to admit `number` / `boolean`, which `SchemaRenderer`'s prop refuses by
ruling — so it would have been a TS2322 at every call site that forwards the result
straight into `<SchemaRenderer schema={…} />`, which is all nineteen of them. The falsy
leg returns nothing instead, which keeps the guarantee and the type both. The exact
equality of the two is pinned in
`packages/react/src/__tests__/SchemaRenderer.propsResolution.test.ts`.

**Migration.** Nothing has to change, and nothing needs a code edit. A slot that authored
`0` or `false` was painting a literal `"0"` / `"false"` where the platform's answer for
those values is nothing; it now renders nothing. If some surface was relying on that stray
text — authoring `action: 0` to make the digit appear — author the string `'0'` instead,
which is a `SchemaNode` and renders as its own text on both paths.

**Supersedes one sentence in the objectui#8331 entry.** That note said the `data-table`
`emptyAction` truthiness leg is kept "precisely so those two never reach the bridge, whose
`String` mapping would otherwise turn them into the text `"0"` and `"false"`". The bridge
no longer does that. The leg is kept anyway, and objectui#8908 kept it deliberately rather
than removing it as newly redundant: it is what makes that slot's answer independent of
the bridge, and it is why `emptyAction` was never affected by this defect in the first
place.
