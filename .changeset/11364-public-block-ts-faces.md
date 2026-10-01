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
  two blocks the zod face does not arm yet, built the way an arm is built.
  The record picker also declares the node-level `dataSource` its renderer
  reads.
- `PageDocumentNode`: the spec's `PageSchema` input with `type` (the page
  kind) required, the shape `PageView` hands to `SchemaRenderer`.
- `AuthoringNode`: the union of all of them.

`@object-ui/react`'s `SchemaRendererProps.schema` is now
`BaseSchema | AuthoringNode | string | null | undefined`. Nothing that
compiled before stops compiling, because `BaseSchema` still carries its index
signature. Once objectui#8347 removes it, a key misspelled inside one of these
nodes' bags is refused, and the spec's spelling compiles. None of these types
carries an index signature, and the prop gains none.
