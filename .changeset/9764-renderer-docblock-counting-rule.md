---
---

Write the counting rule down in the two SVG-host pass-through docblocks
(`packages/components/src/renderers/basic/icon.tsx`,
`packages/components/src/renderers/feedback/spinner.tsx`), so the next reader does not
have to re-derive what "declares exactly" counts (objectui#9764).

Both sentences are TRUE today and neither is corrected here. The question the card was
filed on — does a `?: never` refuse-by-name count as a declared key? — was measured, not
assumed, and the answer is no: what the count is over is the keys an author can WRITE and
the renderer can RECEIVE. Three readings converge on it, each re-taken here rather than
inherited: the `never` keys' own `@deprecated` verdict ("Not a channel `icon` /
`spinner` reads — nothing renders it"); the maintainer ruling those keys were tombstoned
under, recorded with the objectui#9256 family-D pin; and the sentences' own arithmetic —
`spinner`'s says "beyond the SDUI base", and `icon`'s already excluded the `type`
discriminant at the ref it was written on (`e304a4ef7`, where `IconSchema` declared
`type` · `icon` · `size` · `color` and the sentence still said three).

Each added sentence names the RULE and copies no member list, which is the defect this
family of cards exists to treat: a sentence that names the rule survives the next
declaration change, a sentence that copies today's members does not.

Comments only. Measured on a build of `@object-ui/components` rather than argued by
analogy: across the 212 files of the published surface (`files: ["dist", "README.md",
"CHANGELOG.md", "LICENSE"]`), the added prose appears in 0, and so does pre-existing
docblock prose from the same two files ("MEASURED, not assumed" → 0,
`BARE_SPREAD_ON_SVG` → 0), while the live controls on the same instrument and corpus read
`animate-spin` → 3 files and `lucide-react` → 5. The comment channel does not reach a
published byte, so no package is released by this change.
