---
---

No release. Removes the two whole-context type assertions on
`useRecordContext()` — in the `record:activity` renderer and in the line-items
panel — so `RecordContextValue` types those bindings, and adds a census that
keys on the BINDING rather than on an identifier name so the shape cannot come
back (objectui#9304).

Declared as no release because the level follows a measurement rather than a
judgement. A TypeScript type assertion erases, and both renderers export an
explicitly annotated `React.FC`, so nothing inferred reaches the emitted
declarations. Building `@object-ui/plugin-detail` and `@object-ui/plugin-form`
from the base tree and from this one produces 172 dist files of which 171 are
byte-identical by sha256; every emitted `.js`, `.css` and `.d.ts` is among
them. The single difference is one declaration sourcemap, whose `mappings`
shift because an explanatory comment was added above an unchanged statement.
Nothing a consumer of these packages can resolve, import or execute changes.
