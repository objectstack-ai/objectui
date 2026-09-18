---
'@object-ui/types': minor
---

Declare `scale` on `PercentFieldMetadata` (objectui#9784).

**Which face widened:** the published authoring face of the percent field type. I added
`scale?: number` to `PercentFieldMetadata`, which `@object-ui/types` exports from its
package root. A percent field metadata literal carrying `scale` failed the excess-property
check before this change and type-checks after it — so this is a widening of a published
type, not a behavioural change. Nothing about how percent values render moves here.

**Why it was missing, and why it matters:** `scale` is the member the percent renderers
actually read for their decimal width. The percent cell renderer (`PercentCellRenderer` in
`@object-ui/fields`) takes its decimal places from `scale`, corrected from `precision` by
objectui#9295 because reading `precision` padded every value out to the column's total
digit width. The declaration never mentioned `scale`, so an author following the published
type wrote `precision` and silently got zero decimal places — the one key that did anything
was the one the contract did not name.

**Shape:** copied verbatim from `NumberFieldMetadata` in the same module, which already
declares both members and spells the distinction out — `precision` is the `p` in a
`decimal(p, s)` column and is not a display setting, `scale` is the `s` and is the number of
decimal places displayed. A test pins that the two arms keep saying the same thing.

**I did not touch `precision`.** The installed `@objectstack/spec` declares `precision` and
`scale` as a pair on its field face and its `FieldSchema` door accepts both on a `percent`
field document, so `precision` is a spec-legal declaration on this face and stays exactly as
it was. Narrowing or retiring it would move a published accept set, which is a separate
question and is not decided here.
