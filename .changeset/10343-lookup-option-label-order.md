---
'@object-ui/fields': patch
---

fix(fields): a lookup option's label ranks the field's `displayField`, then the referenced object's `nameField`, then `titleFormat` — the ADR-0079 order the record page follows

⚠️ Behaviour change: which text a lookup dropdown option (and the chip it
leaves behind) shows. The inherited lookup branch of ruling C1 on
objectui#9436, tracked as objectui#10343.

- **Before.** `LookupField`'s option label rendered the referenced object's
  deprecated `titleFormat` first, above the object's declared `nameField` and
  above the lookup field's own `displayField`. The same record read one way on
  its record page and in its lookup cell, and another way in the dropdown
  that picks it.
- **After.** The label is `@object-ui/core`'s `getRecordDisplayName` with the
  field's declared `displayField` as its `titleField`, the same call the lookup
  cell renderer already makes: the field's declared `displayField`, then the
  object's `nameField` (and its deprecated aliases), then `titleFormat`, then
  type-aware derivation. A `nameField` blank on the record still falls through
  to the template, and an object that declares only a `titleFormat` still
  renders it.
- **The widget's `name` default no longer outranks the object.** A lookup field
  that declares no `displayField` still reads `name` for quick-create and the
  picker's display column, but in the option label that guess now sits below
  the object's declarations, as `@objectstack/spec` describes the default
  ("the referenced object's name/title"). Without the object's schema the
  label reads `name` first, as before.
- **Templates render through the shared renderer.** The widget's private copy
  of the template renderer is gone. A `{{field}}` placeholder now renders as
  its `{field}` twin, as the `titleFormat` describe says every title renderer
  does, where the option used to show the value inside a stray pair of braces.

**Upgrade effect.** An option label moves when the referenced object declares
a `nameField` and a `titleFormat` that renders something else, or when a
lookup field without a `displayField` points at an object whose `nameField`
is not `name` and whose records also carry a `name` value. objectui#10486
moved the browse-all record picker's display column onto the same resolver,
so on such an object the picker and the dropdown read the same label.
