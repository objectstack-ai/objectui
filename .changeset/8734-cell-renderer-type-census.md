---
'@object-ui/fields': minor
---

Two frozen cell-renderer censuses now read the registry instead of a literal (objectui#8734)

`@object-ui/fields` gains `listCellRendererTypes()` — every field type
`getCellRenderer` resolves to a renderer **of its own**, as opposed to the
`TextCellRenderer` fallback every other spelling lands on. It is the read-side
twin of `FORM_FIELD_TYPES`, and it is a **function** rather than a frozen
constant because `registerFieldRenderer` is published: the cell registry can
grow after the module is evaluated, so a constant would be a snapshot taken at
import time.

**What it repairs.** Two censuses declared in prose that they measure "every
type `getCellRenderer` resolves to a renderer of its own" and enforced that with
a hard-coded population size — `cellRenderers.objectLiteral-8596` in this
package and `summaryChip.badgeFitCensus-8464` in `@object-ui/plugin-detail`.
Registering one more cell renderer left both of them green: the new type is
simply absent from the table, so every row still passes. The summary chip made
that worse in one direction only, because `chipTakesCellRenderer` admits any
type not named in `CHIP_UNFIT_RENDERER_TYPES` — so an unmeasured type was drawn
with its own renderer, which is the case the census exists to rule on. Both
censuses now reconcile their table against the live reading and fail by NAME.

**No behaviour changes.** `getCellRenderer` still rebuilds its standard table on
every call — the table literal moved into a builder function that returns a new
object, so the per-call component identity `cellRenderers.countLabelI18n-8441`
pins is byte-for-byte what it was. The chip's permissive default is unchanged:
inverting it would silently downgrade a legitimately-fitting new type, which is
a product decision about the chip and not part of this repair.
