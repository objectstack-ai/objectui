---
'@object-ui/types': patch
---

Docblock only: `BulkActionDef.visible` now says what the grid's selection bar does with an `ast`-only
envelope (objectui#11322).

It said the envelope "is evaluated as a fault, so no selected record qualifies (fail closed, warned)".
The selection bar now asks the action family's one "is a gate declared?" definition, as the row menu and
the toolbars already did, and that definition reads an envelope with no `source` as no gate: every
selected record qualifies. The type itself is unchanged.
