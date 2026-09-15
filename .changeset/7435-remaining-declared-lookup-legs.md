---
'@object-ui/app-shell': patch
---

Read the two remaining spec-declared lookup spellings `resolveActionParams` could not see
(objectui#7435).

`resolveActionParams`' picker group read the resolved object-schema field def in
`snake_case` only for `lookupColumns` and `lookupPageSize`. That def is what
`getObjectSchema` / `useMetadata()` serve, and it carries the spelling
`@objectstack/spec`'s `FieldSchema` declares — so both values were dropped on the floor
and a field-backed action param rendered its record picker with default columns and a
default page size. Nothing warned, because the resolver was simply reading keys that were
not there. Each key now has its declared spelling ranked FIRST, with the existing
`snake_case` leg kept behind it in its existing order — the shape objectui#7155
established and objectui#9121 applied to `displayField` / `descriptionField` /
`lookupFilters` at this same site.

Measured on the pin this tree resolves, `@objectstack/spec@17.4.0`: `FieldSchema.safeParse`
over a minimal lookup def accepts both camelCase keys and refuses both snake twins with
`unrecognized_keys`, with the minimal def accepted and a nonsense key refused as controls
in the same run.

The legacy legs are kept rather than retired. A producer sweep found no in-repo producer
of either snake spelling and zero key-position occurrences in the producer repo (controls
lit), but two producers lie outside what that sweep measures: a document stored before the
key was tightened, since the serve path runs no parse, and a host `DataSource` that never
passes through the adapter's key canonicalisation.

`dependsOn` — the third declared key recorded on this card — deliberately keeps its
snake-only read. The camel leg was built and rendered before being refused: a field-backed
lookup param whose def declares the spec spelling then renders a permanently gated,
disabled picker, because the action dialog supplies dependent values only to the cascade
option widgets and `lookup` is not one of them. That would trade a config-loss bug for an
unusable picker, so the disposition is left to objectui#8672, which owns the question.
