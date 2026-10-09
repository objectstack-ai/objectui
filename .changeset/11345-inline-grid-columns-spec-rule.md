---
'@object-ui/plugin-form': patch
---

`deriveColumns`, the default columns of a master-detail inline grid whose author listed none, now takes which columns it draws, their order and which of them are `defaultHidden` from `@objectstack/spec`'s `deriveInlineGridColumns`, and its visible budget from the spec's `DEFAULT_MAX_INLINE_GRID_COLUMNS` (objectui#11345). The rule is the spec's now, so objectstack's `field-no-consumers` lint credits exactly the columns this grid draws.

The output does not change. The signature is the same, and each column's label, cell type, options, lookup target, conditional rules and computed expression are still built from the child field here, including a plain text column for a field whose definition is falsy. The module-level `DEFAULT_MAX_INLINE_COLUMNS` constant, which the package entry never exported, is removed.

`@object-ui/plugin-form` raises its `@objectstack/spec` floor from `^17.0.0` to `^17.6.0`, because its published entry now imports `deriveInlineGridColumns` and `DEFAULT_MAX_INLINE_GRID_COLUMNS`, which the spec first exports in 17.6.0.
