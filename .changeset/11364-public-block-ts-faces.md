---
'@object-ui/types': minor
'@object-ui/react': minor
---

The spec's page blocks, the `element:text_input` / `element:record_picker`
rows and a stored page document under its page kind have a TypeScript
authoring type, and `SchemaRenderer`'s `schema` prop accepts them
(objectui#11364).

`@object-ui/types` exports, each derived by reference and none restated:

- `PublicBlockNode`: one member per arm of the zod face's
  `PublicBlockComponentSchema` (`element:text`, `page:tabs`, `action:button`
  and the rest), each the arm's own input. Its `properties` bag is the block's
  `ComponentPropsMap` row in `@objectstack/spec`. `PublicBlockNodeOf<'…'>`
  picks one member.
- `ElementTextInputNode` and `ElementRecordPickerNode`: the spec rows of the
  two blocks the zod face does not arm yet, each built the way an arm is
  built: the zod `BaseSchema` shape extended with the `type` literal, the node
  envelope (`responsiveStyles`, the spec's `ResponsiveStylesSchema`),
  `properties` as the row, and the `body` / `children` refusals every arm
  carries. The record picker also declares the node-level `dataSource` its
  renderer reads.
- `PageDocumentNode`: the spec's `PageSchema` input with `type` (the page
  kind) required, the shape `PageView` hands to `SchemaRenderer`.
- `AuthoringNode`: the union of all of them.

`@object-ui/react`'s `SchemaRendererProps.schema` is now
`BaseSchema | AuthoringNode | string | null | undefined`, and
`toRenderableSchema`, which returns `SchemaRendererProps['schema']` by
reference, widens its return type with it. Every value the old union accepted
is still accepted. Reading is a different matter: on a union, a key that one
closed member does not declare is TS2339, whatever `BaseSchema`'s index
signature allows. No caller in this repository reads a key off the prop's type
or off the bridge's return (the `Type Check` job re-derives that); code that
does needs to narrow first. Once objectui#8347 removes the index signature,
a key misspelled inside one of these nodes' bags is refused, and the spec's
spelling compiles. None of these types carries an index signature, and the
prop gains none.

⚠️ **Dated note, 2026-10-02 — the prop takes the declared-node union — objectui#11466.** At this change `SchemaRendererProps.schema` was `BaseSchema | AuthoringNode | string | null | undefined`, and every value the old union accepted was still accepted; now, later in this same release, it is `DeclaredNode | string | null | undefined`. `DeclaredNode` (`@object-ui/types`) is the union, keyed by `type`, of the component schemas `AnySchema` declares (without its `BaseSchema` arm and without the app-level document `AppComponentSchema`), `AuthoringNode`, and the types an application declares in `CustomNodeRegistry`, so a value typed `BaseSchema` or a `type` nothing declares is refused. `PageDocumentNode` admits every page kind but the interface-mode `list`. The rest of this entry is kept as the reading of this change.
