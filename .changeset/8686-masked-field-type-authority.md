---
'@object-ui/fields': minor
'@object-ui/plugin-detail': patch
---

feat(fields): `isMaskedFieldType()` and `MASKED_FIELD_TYPES` answer "is this field type's cell drawn as a mask?"

**New public API on `@object-ui/fields`:** `MASKED_FIELD_TYPES` (a `ReadonlySet<string>`,
today `password` and `secret`) and `isMaskedFieldType(fieldType)`. They are the read-side
twin of `INLINE_EXCLUDED_FIELD_TYPES` / `isInlineExcludedFieldType()`. Additive; nothing
existing changes shape.

Until now the fact lived only as two entries in `getCellRenderer`'s standard table, and
nothing outside the package could ask it. So the detail page's copy refusal
(objectui#8440) kept its own two-member list: a masked type added to the fields package
would render masked and stay one click from the clipboard there.

- The standard table's masked entries are now built from `MASKED_FIELD_TYPES`, so the
  set and the drawn mask are one fact.
- `isMaskedFieldType()` reads the LIVE cell registry. A type registered with the mask
  (`registerFieldRenderer('api_token', getCellRenderer('password'))`) answers `true`. A
  shipped mask replaced at runtime with one of this package's own renderers answers
  `false`, since none of them is the mask; the cell then draws what that renderer draws
  (for `TextCellRenderer`, the value). A shipped mask
  replaced with a host component the package cannot inspect keeps the declared answer
  (`true`), on the side that withholds the value.
- It matches raw spellings only, as `getCellRenderer` does: `field:password` renders in
  the clear and is not masked.

`@object-ui/plugin-detail`: `isMaskedDetailFieldType` now asks `isMaskedFieldType()`
instead of keeping its own list. It stays the narrow-only union of the view's and the
object's type (objectui#3355). Behaviour changes only where the two used to disagree:
a masked type registered at runtime now refuses the copy affordance, and a shipped mask
that a host replaced with a package text renderer offers it again.
