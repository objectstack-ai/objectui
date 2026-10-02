---
'@object-ui/plugin-grid': patch
---

Grid percent faces read the field's declared storage (objectui#11475).

- The desktop cell's field bag (column paths A, B and C) now carries the
  field's `max`, the storage statement the percent cell reads through the
  spec's `percentScaleOf`. Without it, a whole-stored `50` (`max: 100`) would
  read `5000%`.
- The column-summary footer scales a `percent` column's aggregate at its
  field's storage, so a fraction-stored column summing to `1` reads
  `Sum: 100%`.
- ⚠️ Visible change on the mobile card: its percent slot is chosen by the
  column's NAME (`probability`, `percent`, `rate`, `ratio`, `confidence`,
  `score`). A field that is not a `percent` declares no percent storage (the
  spec: "a plain `number` carries no percent semantics"), so such a field now
  prints through its own cell, the way the desktop row prints it, with no
  percent affix. The showcase's `lead_score` and `tax_rate` (both
  `Field.number`) used to print with a percent sign there and now print as
  numbers. A `percent` field in that slot reads at its declared storage.
