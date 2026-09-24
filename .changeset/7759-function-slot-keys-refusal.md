---
'@object-ui/types': minor
---

Refuse the four remaining function-valued mirror keys by name (objectui#7759 group E, the objectui#6124 shape).

`TableColumnSchema.cell`, `DataTableSchema.renderCellEditor`, `FieldConstraintsSchema.validate` and `FieldConditionSchema.custom` were bare `z.function()` arms. A JSON author could never satisfy them and got zod's bare `invalid_type … expected function`, while a live function of ANY signature parsed green. Each is now a `handlerKeyRefusal()` arm: every value is refused with a `custom` issue at the key's own path, and the message names the key and says why JSON cannot author it.

**Accept-set change (breaking semantics, released as `minor` by the version-alignment rule):** the zod mirrors now also refuse a live function for these keys, the same change objectui#6124 made for the `on*` keys. Programmatic hosts are unaffected: they supply these functions through the TypeScript interfaces and React props, and no runtime path runs them through `safeParse`.

TypeScript face, measured per key on the renderers:

- `TableColumn.cell`, `DataTableSchema.renderCellEditor` and `FieldValidationRules.validate` stay callable (runtime slots: `data-table` calls `cell` and `renderCellEditor`, and the form renderer runs a supplied `validate`).
- `FieldCondition.custom` is retired to `?: never`. Nothing ever read it: the form renderer translates `condition` from `field` / `equals` / `notEquals` / `in` only, so a supplied function never ran. Express the condition with those keys, or with the field's `visibleWhen` predicate.

This supersedes two statements in changesets pending in the same release: objectui#6124's "the four non-`on*` `z.function()` keys stay as they are" and objectui#7188's "the zod mirror's `renderCellEditor` is `z.function()`". Both were true when written; neither is after this change.
