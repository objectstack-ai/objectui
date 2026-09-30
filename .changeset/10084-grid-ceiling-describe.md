---
'@object-ui/types': patch
---

`object-grid`'s `rowActions` now carries a describe, and the `ObjectGridSchema.operations` / `rowActions` docblocks state how the two keys combine: `operations` is the CEILING over `rowActions` (`operations.update: false` / `delete: false`, or a member a declared block does not name, withholds that generic row entry whatever `rowActions` says), a declared `rowActions` list offers the generic Edit / Delete only for the canonical `edit` / `delete` names it carries, and an absent `rowActions` keeps the default. Text only: no member is added and no behaviour changes — it describes what objectui#9819 and objectui#10083 landed.
