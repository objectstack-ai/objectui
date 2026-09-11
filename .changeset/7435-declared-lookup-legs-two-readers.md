---
'@object-ui/plugin-charts': patch
'@object-ui/app-shell': patch
---

Read the spec-declared lookup spellings in two readers that could not see them at all
(objectui#7435).

`ObjectChart`'s group-by label chain and `resolveActionParams`' picker group both read the
object-schema field def in `snake_case` only. That def is what `getObjectSchema` /
`useMetadata()` serve, and it carries the spelling `@objectstack/spec`'s `FieldSchema`
declares — so `displayField`, `descriptionField` and `lookupFilters` were dropped on the
floor. The chart fell through to the generic `name` heuristic and drew a label the author
had explicitly overridden; an action param rendered its picker with defaults. Nothing
warned, because the readers were simply reading keys that were not there.

Each of the three keys now has its declared spelling ranked FIRST, with the existing
`snake_case` legs kept behind it in their existing order — the shape objectui#7155
established. Measured on the pin this tree resolves, `@objectstack/spec@17.4.0`:
`FieldSchema.safeParse` over a minimal lookup def accepts all three camelCase keys and
refuses every snake twin with `unrecognized_keys`, with the minimal def accepted and a
nonsense key refused as controls in the same run.

The legacy legs are kept rather than retired. A per-site producer sweep found no in-repo
producer of any of the three snake spellings and zero key-position occurrences in the
producer repo (control lit), but two producers lie outside what that sweep measures: a
document stored before the key was tightened, since the serve path runs no parse, and a
host `DataSource` that never passes through the adapter's key canonicalisation. Dropping a
leg would be a silent regression for already-authored data.

Two keys deliberately gain nothing. `idField` has no `FieldSchema` spelling in either
casing, and `titleFormat` is an object-level key whose canonical target is deprecated in
favour of `nameField`; reading either camelCase spelling would fossilise a key no contract
declares, so both keep their existing snake-only reads and their absence is now pinned.
