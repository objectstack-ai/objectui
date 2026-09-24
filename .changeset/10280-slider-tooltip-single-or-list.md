---
'@object-ui/types': minor
---

feat(types): `slider` and `tooltip` single-or-list keys follow their read sites (objectui#10280, objectui#7759 group B)

Three keys that `@objectstack/spec` does not declare, where the zod mirror accepted a
spelling the TypeScript declaration refused. Each now matches what its renderer reads.

- **`SliderSchema.defaultValue` is now `number | number[]` (wider).** The `slider`
  renderer turns a single number into a one-item list, so both spellings render. The
  mirror already accepted both, and the TypeScript declaration now does too. Code that
  writes the key keeps compiling. Code that reads it must now handle a single number; the
  in-repo renderer already does.
- **BREAKING (authoring): `SliderSchema.value` is retired on both faces.** No renderer
  reads it: the `slider` renderer reads `defaultValue`, `max`, `min` and `step`, and the
  form-control DOM whitelist drops `value` from the props it passes on. An authored `value`
  rendered nothing. The mirror now refuses it by name with a message that points at
  `defaultValue`, and the TypeScript member is `value?: never`. To migrate, write the
  initial position as `defaultValue`.
- **BREAKING (authoring): `TooltipSchema.content` no longer accepts a list.** The renderer
  puts `content` straight into a React child position without rendering it through
  `renderChildren`, so a list of nodes failed to render with "Objects are not valid as a
  React child". The mirror now accepts `string | SchemaNode`, the same as the declaration,
  which has not changed. To migrate, put a list under `children`, which the renderer does
  render as a list.

Marked `minor` under this repo's version-alignment rule (`major` is reserved for
following an `@objectstack` major); the breaking authoring changes are named above.
