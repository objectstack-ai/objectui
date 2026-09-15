---
---

Correct two claims in `packages/fields/README.md` (objectui#8294, objectui#8292).

The "Using Standard Fields" fence resolved the renderer straight off the field's
declared type (`getCellRenderer(field.type)`), which skips the format-hint
mapping every shipped view goes through; it now teaches the two-step
`getCellRenderer(resolveCellRendererType(field))`. The Features list named
`FieldRegistry`, a symbol this package does not export; it now names
`registerFieldRenderer`, which it does.

Documentation only — no package source, no published contract, and no runtime
behaviour changed, so no package is released by this change.
