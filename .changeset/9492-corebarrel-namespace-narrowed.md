---
'@object-ui/app-shell': patch
---

Narrow the CEL authoring bridge's dynamic `@object-ui/core` import to the one symbol it
consumes (objectui#9492).

`loadRowCanon()` in the metadata-admin CEL authoring bridge loaded `@object-ui/core`
dynamically — correctly, because the row-spelling detector imports `@objectstack/formula`
at module scope and a static import would drag the CEL parser into this module's chunk.
But its `.then` callback returned the imported **namespace object**, which the module
then cached in a Promise. A namespace that escapes is a namespace that is live, so the
bundler had to retain **every** export of the `@object-ui/core` barrel on the eager path:
the specifier was dynamic and the payload was eager anyway.

The callback now destructures `detectNonCanonicalRowSpelling` — the single member the
local `RowCanonModule` interface declares and the single member this file accesses — so
only that binding escapes and the rest of the barrel is shakeable.

**No behaviour changes.** The specifier is unchanged and still dynamic, still
feature-detected, still swallowing every failure; objectui#9185's lazy boundary is
narrowed, not reverted. What the console's eager chunks weigh after it is what
`pnpm check:eager-closure` prints — the figures are left to that instrument rather than
copied into this note.
