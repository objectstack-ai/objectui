---
'@object-ui/types': minor
'@object-ui/plugin-form': minor
'@object-ui/plugin-charts': minor
'@object-ui/app-shell': minor
---

`FormulaFieldMetadata` declares `@objectstack/spec`'s `expression` in place of `formula`, and three readers of a lookup's display pointer read the spec's `displayField` alone (objectui#11070, round 6). Both retired spellings go at once, with no alias.

- **Types.** `FormulaFieldMetadata.formula` is removed. `FormulaFieldMetadata.expression` is `FieldSchema`'s `expression` by reference: a CEL source string, or the spec's `{ dialect, source, … }` envelope. Nothing in ObjectUI read the removed member through the type. `FieldSchema` refuses `formula` by name on every field type, with a rename hint to `expression`.
- **Form payloads.** `sanitizeFormData` (`@object-ui/plugin-form`) no longer treats a `formula` key as a "computed" flag. Every `type: 'formula'` field is still dropped from the payload by its type, as before. Only a field of some other type that carries `formula` changes: its value is now sent like any writable field's. The spec refuses such a definition at publish, so a served one cannot carry it.
- **Display pointer.** `deriveColumns` and `hydrateColumns` (`@object-ui/plugin-form`, the master-detail grid columns), `ObjectChart`'s group-by labels (`@object-ui/plugin-charts`) and the action-param resolver (`@object-ui/app-shell`) read `displayField`, then `reference_field`. None of them reads `display_field` any more.
- **A fix for spec-spelled lookups in master-detail grids.** `deriveColumns` and `hydrateColumns` read `display_field || reference_field` before, with no `displayField` leg. A lookup that declared only `displayField`, which is the spec's spelling, got no display pointer on its grid column. It now gets one.

A definition served through `ObjectStackAdapter.getObjectSchema` or `MetadataProvider` loses nothing: the ingestion pass (objectui#7650) stamps a stored `display_field` onto `displayField` before any of these readers sees it. Measured with a lookup carrying `display_field: 'title'` served through `ObjectStackAdapter.getObjectSchema`: the master-detail column (`deriveColumns` and `hydrateColumns`), the chart's axis label and the action param all resolve the `title` column before and after this change.

## ⚠️ BREAKING, priced as minor under the fixed group's version policy

TypeScript that writes `formula` on a `FormulaFieldMetadata` no longer compiles (an excess-property error naming the key). Rename it to `expression` and write the formula in CEL against the record, for example `record.quantity * record.unit_price`.

At runtime, a lookup whose display pointer is spelled only `display_field` loses it wherever the ingestion pass does not run first. Measured before and after this change, on a lookup with `display_field: 'title'` handed to the readers directly:

- **`deriveColumns` / `hydrateColumns` with a `childSchema` that did not come through the ingestion pass** (an external caller, or a master-detail form whose `DataSource` is not `ObjectStackAdapter`): the column's `displayField` was `title`. It is now absent.
- **`ObjectChart` on a `DataSource` other than `ObjectStackAdapter`**, grouped by that lookup: the axis label came from the `title` column. It now comes from the `name` column, the generic fallback.
- **The action-param resolver, when a host passes its own unfolded `objects`** (for example through `RecordDetailView`'s `objects` prop): the lookup param's `displayField` was `title`. It is now absent.

The same lookups spelled `displayField` resolve the `title` column in all three after this change. Before it, the chart and the action param already did, and the master-detail columns did not (the fix above).

**Fix:** spell the pointer `displayField`, or serve the definition through `ObjectStackAdapter`.
