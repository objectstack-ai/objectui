---
'@object-ui/plugin-detail': patch
---

The record header's percent summary chip, text and bar, scales at the storage
its field declares (`percentCellScale`, the spec's `percentScaleOf`: a fraction
unless the field declares a `max` above 1). It no longer guesses the storage
from the value (objectui#11475). `summaryChipPercentPoints(raw)` becomes
`summaryChipPercentPoints(raw, percentScale)`. The related list's cell now
carries the field's `max`. Without it, a whole-stored `50` (`max: 100`) would
read `5000%` there once the cell reads the declaration.
