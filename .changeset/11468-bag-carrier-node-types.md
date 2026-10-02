---
'@object-ui/types': minor
---

The authored `properties`-bag carriers outside the spec's public blocks have a
TypeScript authoring type, and `AuthoringNode` includes them, so
`SchemaRenderer`'s `schema` prop accepts them (objectui#11468).

`@object-ui/types` exports, each derived by reference from its zod arm and none
restated:

- `ObjectQLPublicBlockNode`: one member per arm of the zod face's
  `ObjectQLPublicBlockComponentSchema`, each the arm's own input, derived the
  way `PublicBlockNode` is. The eight members are also exported by name:
  `ObjectMetricBlockNode`, `ObjectMasterDetailFormBlockNode`,
  `ObjectTimelineBlockNode`, `ObjectFormBlockNode`, `ObjectMapBlockNode`,
  `ObjectChartBlockNode`, `ObjectGanttBlockNode` and `ObjectGridBlockNode`.
  Each is the authored node, its props in the `properties` bag. The flat
  `ObjectFormSchema`, `ObjectMapSchema`, `ObjectGanttSchema`,
  `ObjectChartSchema` and `ObjectGridSchema` stay the node as its renderer
  reads it after the hoist.
- `FlexBlockNode`: the `FlexBlockSchema` arm's input, its props and its child
  list in the `properties` bag. `FlexSchema` stays the node as the `flex`
  renderer reads it.

The derivation now reads a bag's shape the way it reads the arm's. `flex` and
`object-chart` have no `ComponentPropsMap` row, so each bag is its flat
mirror's own members, kept open for the tolerant zod face; on these node types
the bag is closed, as the strict authoring face closes it, so a misspelled bag
key does not compile. A spec-row bag is already closed: `PublicBlockNode` is
unchanged, which `authoring-nodes-bag-carriers-11468.test.ts` pins.

Adding members to `AuthoringNode` widens what the prop accepts; every value it
accepted before is still accepted. Reading is a different matter: on a union, a
key that one closed member does not declare is TS2339, so code that reads a key
off `SchemaRendererProps['schema']` or off `toRenderableSchema`'s return needs
to narrow first.
