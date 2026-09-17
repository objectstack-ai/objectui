---
---

Docblock-only split in `@object-ui/types`: `SchemaRegistry` now states which half of its
promise it can keep. The interface documented itself as "the Single Source of Truth for
component type lookups" without qualification, and for a component whose renderer lives in
a plugin package that is structurally unachievable on the value side — this package cannot
name the type such a renderer honours, because `pnpm check:phantom-deps` judges
`import type` exactly as it judges a value import and refuses the undeclared specifier,
while declaring the dependency closes a cycle through the plugin that already depends on
this package. objectui#7645 is the worked example the docblock now points at, and the
sentence that made that divergence a finding is what this change repairs.

The claim is split rather than weakened: the **key set** keeps the Single-Source-of-Truth
wording, because `keyof SchemaRegistry` IS the published `ComponentType` union and that
half is load-bearing; a **value** is now documented as the strongest type this layer can
reach for that key, which for a plugin-rendered component may be narrower than the type the
renderer honours — a limit of this layer's reach, not a licence for an entry to over-claim.

No member of `SchemaRegistry` is added, removed, renamed or retyped, so `ComponentType` is
byte-identical and no published behaviour changes. Comments do reach the published
`.d.ts`, which is why this is declared rather than skipped.
