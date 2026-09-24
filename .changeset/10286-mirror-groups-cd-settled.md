---
'@object-ui/types': minor
---

fix(types): settle three mirror-vs-declaration disagreements from objectui#7759 groups C and D

Each of these keys had a zod mirror that accepted something its TypeScript
declaration refused, or the other way round. Each is now settled by the
objectui#7759 ruling: where the spec declares a key, both faces follow the spec;
where it does not, the renderer's read site decides.

- `FilterField.operators` (inside `FilterBuilderSchema.fields`) now states the
  spec's canonical filter vocabulary on both faces: `VIEW_FILTER_OPERATORS` from
  `@objectstack/spec/ui`, twenty members. The declaration used to offer
  `is_empty` / `is_not_empty` and the mirror `is_null` / `is_not_null`, so each
  face refused a spelling the other accepted. Both faces now accept all four,
  plus `icontains`, `before`, `after` and `between`.
- `ContainerSchema.maxWidth` no longer parses `true`. The key is not in the spec,
  and the `container` renderer draws no max-width class at all for `true` (not the
  default `max-w-xl`, and not the `max-w-none` that `false` gives). The
  declaration never admitted it.
- `HeaderBarSchema.variant` is retired on both faces (ADR-0049). The key is not in
  the spec, and the `header-bar` renderer reads no variant: every spelling
  rendered the same header. The declaration offered `floating` and the mirror
  `transparent`. The mirror now refuses the key by name, and the declaration types
  it `never`.

Breaking, but only for documents the renderer ignored anyway: a `container` with
`maxWidth: true`, or a `header-bar` with any `variant`, now fails validation. Delete
the key. `FormSchema.mode` is not changed here.
